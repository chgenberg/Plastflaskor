import { BuyerType, InvoiceStatus, OrderStatus, Role } from "@prisma/client";
import { prisma } from "../db";
import { getIntegrations } from "../integrations/composition";
import { getPriceListForBuyer, resolveUnitPrice } from "./catalog.service";
import { notifyOrderChange } from "./notify";
import { canTransition } from "@/domain/enums";
import { addLeadTimeDays, isOverdue } from "@/domain/orderBrief";
import { buildPriceSnapshot, parseExtras, type ExtraLine } from "@/domain/extras";
import { emptyCupDocument, parseCupDocument } from "@/domain/cupDocument";
import { parseVisualSpec, visualSpecFromOptions } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { parseCupOptions } from "@/domain/cupCatalog";

export type OrderListFilters = {
  status?: OrderStatus;
  q?: string;
  phaseStatuses?: string[];
  source?: string;
  buyerType?: BuyerType;
  factoryId?: string;
  invoiceStatus?: InvoiceStatus;
  dateFrom?: string;
  dateTo?: string;
  size?: "12" | "23" | "35";
  wall?: "enkel" | "dubbel";
  eco?: "ja" | "nej";
  late?: "1" | "0";
};

const orderInclude = {
  customer: { include: { addresses: true, company: true, priceList: true } },
  reseller: { include: { company: { include: { addresses: true } }, priceList: true } },
  items: { include: { variant: { include: { product: { include: { printRequirements: true } } } } } },
  shippingAddress: true,
  jobs: { include: { factory: true } },
  shipments: true,
  invoice: true,
  documents: true,
  designs: { include: { files: true } },
  artworkVersions: true,
  artworkApprovals: true,
  leads: true,
} as const;

export async function listOrdersForReseller(resellerId: string) {
  return prisma.order.findMany({
    where: { resellerId },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function listOrdersForCustomer(customerId: string) {
  return prisma.order.findMany({
    where: { customerId, buyerType: "CUSTOMER" },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function listActiveFactories() {
  return prisma.factory.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function listAllOrders(filters?: OrderListFilters) {
  const statuses = filters?.status ? [filters.status] : filters?.phaseStatuses;
  const volumeMl = filters?.size === "12" ? 120 : filters?.size === "23" ? 230 : filters?.size === "35" ? 350 : undefined;
  const q = filters?.q?.trim();
  const and: object[] = [];
  if (statuses?.length) and.push({ currentStatus: { in: statuses as OrderStatus[] } });
  if (filters?.source) and.push({ source: filters.source });
  if (filters?.buyerType) and.push({ buyerType: filters.buyerType });
  if (filters?.factoryId) {
    and.push({ OR: [{ factoryId: filters.factoryId }, { jobs: { some: { factoryId: filters.factoryId } } }] });
  }
  if (filters?.invoiceStatus === "NOT_READY") {
    and.push({ OR: [{ invoice: { is: null } }, { invoice: { is: { status: "NOT_READY" } } }] });
  } else if (filters?.invoiceStatus) {
    and.push({ invoice: { status: filters.invoiceStatus } });
  }
  if (filters?.dateFrom || filters?.dateTo) {
    and.push({
      requestedDate: {
        ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
        ...(filters.dateTo ? { lte: filters.dateTo } : {}),
      },
    });
  }
  if (volumeMl) and.push({ items: { some: { variant: { volumeMl } } } });
  if (q) {
    and.push({
      OR: [
        { orderNo: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { email: { contains: q } } },
        { customer: { phone: { contains: q } } },
        { customer: { orgNr: { contains: q } } },
        { reseller: { company: { name: { contains: q } } } },
        { reseller: { company: { orgNr: { contains: q } } } },
        { reseller: { company: { email: { contains: q } } } },
        { reseller: { company: { phone: { contains: q } } } },
        { invoice: { invoiceNo: { contains: q } } },
        { shipments: { some: { trackingNo: { contains: q } } } },
        { items: { some: { variant: { product: { name: { contains: q } } } } } },
      ],
    });
  }
  const rows = await prisma.order.findMany({
    where: and.length ? { AND: and } : {},
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

  return rows.filter((o) => {
    if (filters?.wall || filters?.eco) {
      const opt = parseCupOptions(o.items[0]?.variant.optionsJson);
      if (filters.wall && opt.wall !== filters.wall) return false;
      if (filters.eco === "ja" && !opt.eco) return false;
      if (filters.eco === "nej" && opt.eco) return false;
    }
    if (filters?.late === "1" && !isOverdue(o.currentStatus, o.requestedDate)) return false;
    if (filters?.late === "0" && isOverdue(o.currentStatus, o.requestedDate)) return false;
    return true;
  });
}

export async function getOrderByNo(orderNo: string) {
  return prisma.order.findUnique({
    where: { orderNo },
    include: orderInclude,
  });
}

export async function eventsFor(entityId: string) {
  return prisma.statusEvent.findMany({
    where: { entityId },
    orderBy: { occurredAt: "asc" },
  });
}

export async function advanceOrder(orderId: string, toStatus: OrderStatus, actorRole: Role, source = "user") {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order saknas");
  if (!canTransition(order.currentStatus, toStatus)) {
    throw new Error(`Ogiltig statusövergång ${order.currentStatus} → ${toStatus}`);
  }
  await prisma.order.update({ where: { id: orderId }, data: { currentStatus: toStatus } });
  await prisma.statusEvent.create({
    data: {
      entityType: "ORDER",
      entityId: orderId,
      fromStatus: order.currentStatus,
      toStatus,
      actorRole,
      source,
    },
  });
  await notifyOrderChange(orderId, toStatus);
}

async function nextOrderNo() {
  const count = await prisma.order.count();
  return `AV-${10500 + count}`;
}

async function resolvePrice(input: { resellerId?: string | null; customerId?: string | null; variantId: string; qty: number }) {
  const list = await getPriceListForBuyer(input);
  const price = resolveUnitPrice(list?.items ?? [], input.variantId, input.qty);
  if (!price) throw new Error("Kontakta oss för pris");
  return price;
}

function lidFinishWallFromSource(
  source: { cupDocumentJson: string | null; visualSpecJson: string | null },
  variantOptionsJson: string,
): { lid: "none" | "white" | "black"; finish: "matte" | "glossy"; wall: "enkel" | "dubbel" } {
  const doc = parseCupDocument(source.cupDocumentJson);
  if (doc) {
    return { lid: doc.options.lid, finish: doc.options.finish, wall: doc.options.wall };
  }
  const spec = parseVisualSpec(source.visualSpecJson);
  if (spec) {
    const lid = spec.lid.includes("Vitt") ? "white" : spec.lid.includes("Svart") ? "black" : "none";
    const finish = spec.finish === "Glossy" || spec.finish === "Glans" ? "glossy" : "matte";
    const wall = spec.wall.toLowerCase().includes("dubbel") ? "dubbel" : "enkel";
    return { lid, finish, wall };
  }
  const opt = parseCupOptions(variantOptionsJson);
  return { lid: opt.lid ?? "none", finish: opt.finish ?? "matte", wall: opt.wall };
}

function specFor(variant: { name: string; volumeMl: number | null; optionsJson: string; product: { name: string; slug: string } }, qty: number, lid: string, finish: string) {
  const merged = { ...parseCupOptions(variant.optionsJson), lid: lid as "none" | "white" | "black", finish: finish as "matte" | "glossy" };
  return visualSpecFromOptions({
    productName: variant.product.name,
    qty,
    volumeMl: variant.volumeMl,
    optionsJson: JSON.stringify(merged),
    imageSrc: imageForProduct(variant.product.slug),
  });
}

export async function createBuyerOrder(input: {
  buyerType: BuyerType;
  resellerId?: string | null;
  customerId: string;
  variantId: string;
  qty: number;
  addressId?: string;
  line1?: string;
  postalCode?: string;
  city?: string;
  invoiceRef?: string;
  requestedDate?: string;
  deliveryRequirement?: string;
  notes?: string;
  lid?: string;
  finish?: string;
  designId?: string;
  actorRole: Role;
  source?: string;
  sourceOrderId?: string;
}) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: input.variantId },
    include: { product: { include: { printRequirements: true } } },
  });
  if (!variant || variant.product.category !== "PAPER_CUP") throw new Error("Endast pappersmuggar kan beställas");
  if (input.qty < variant.product.moq) throw new Error(`Minsta antal är ${variant.product.moq}`);

  const price = await resolvePrice({
    resellerId: input.resellerId,
    customerId: input.customerId,
    variantId: variant.id,
    qty: input.qty,
  });

  let addressId = input.addressId;
  if (!addressId) {
    const addr = await prisma.address.create({
      data: {
        type: "SHIPPING",
        line1: input.line1 || "Anges senare",
        postalCode: input.postalCode || "00000",
        city: input.city || "Sverige",
        customerId: input.customerId,
      },
    });
    addressId = addr.id;
  }

  const factory = await prisma.factory.findFirst({ where: { isActive: true } });
  const lid = input.lid ?? "none";
  const finish = input.finish ?? "matte";
  const visual = specFor(variant, input.qty, lid, finish);
  const design = input.designId
    ? await prisma.design.findUnique({ where: { id: input.designId } })
    : null;
  const fromDesign = parseCupDocument(design?.cupDocumentJson);
  const cupDoc = fromDesign
    ? {
        ...fromDesign,
        productSlug: variant.product.slug,
        quantity: input.qty,
        options: {
          ...fromDesign.options,
          lid: (lid as "none" | "white" | "black") ?? fromDesign.options.lid,
          finish: (finish as "matte" | "glossy") ?? fromDesign.options.finish,
        },
      }
    : emptyCupDocument({
        productSlug: variant.product.slug,
        quantity: input.qty,
        wall: parseCupOptions(variant.optionsJson).wall,
        eco: parseCupOptions(variant.optionsJson).eco,
        finish: finish as "matte" | "glossy",
        lid: lid as "none" | "white" | "black",
        requirements: variant.product.printRequirements.map((r) => ({
          code: r.code,
          label: r.label,
          placed: false,
          required: r.required,
        })),
      });
  const preliminaryDate = addLeadTimeDays(variant.product.leadTimeDays);

  const order = await prisma.order.create({
    data: {
      orderNo: await nextOrderNo(),
      buyerType: input.buyerType,
      resellerId: input.resellerId ?? null,
      customerId: input.customerId,
      currentStatus: "SUBMITTED",
      shippingAddressId: addressId,
      factoryId: factory?.id,
      source: input.source ?? (input.buyerType === "CUSTOMER" ? "customer_order" : "reseller_order"),
      sourceOrderId: input.sourceOrderId,
      notes: input.notes,
      invoiceRef: input.invoiceRef,
      requestedDate: input.requestedDate,
      deliveryRequirement: input.deliveryRequirement,
      preliminaryDate,
      visualSpecJson: JSON.stringify(visual),
      cupDocumentJson: JSON.stringify(cupDoc),
      items: {
        create: {
          variantId: variant.id,
          qty: input.qty,
          unitPriceExVat: price.unitPriceExVat,
          designId: input.designId,
          visualSpecJson: JSON.stringify(visual),
          cupDocumentJson: JSON.stringify(cupDoc),
        },
      },
    },
  });

  if (input.designId) {
    await prisma.design.update({
      where: { id: input.designId },
      data: { orderId: order.id, status: "ATTACHED_TO_ORDER", cupDocumentJson: JSON.stringify(cupDoc) },
    });
  }

  if (factory) {
    await prisma.productionJob.create({
      data: { orderId: order.id, factoryId: factory.id, status: "NOT_PLANNED" },
    });
  }

  await prisma.statusEvent.create({
    data: {
      entityType: "ORDER",
      entityId: order.id,
      toStatus: "SUBMITTED",
      actorRole: input.actorRole,
      source: input.source ?? "order",
    },
  });
  await advanceOrder(order.id, "AQUA_REVIEW", input.actorRole, "system");
  await getIntegrations().email.sendOrderConfirmation(order.id);
  return order;
}

export async function createQuote(input: {
  company: string;
  email: string;
  phone?: string;
  city?: string;
  message?: string;
  productId: string;
  qty: number;
  designId?: string;
}) {
  const publicReseller = await prisma.reseller.findFirst({ where: { code: "PUBLIC-LEAD" } });
  if (!publicReseller) throw new Error("Publik lead-reseller saknas i seed");
  const variant = await prisma.productVariant.findFirst({
    where: { productId: input.productId, product: { category: "PAPER_CUP" } },
  });
  if (!variant) throw new Error("Välj en pappersmugg");
  const customer = await prisma.customer.create({
    data: {
      resellerId: publicReseller.id,
      name: input.company,
      email: input.email,
      phone: input.phone,
    },
  });
  return createBuyerOrder({
    buyerType: "RESELLER",
    resellerId: publicReseller.id,
    customerId: customer.id,
    variantId: variant.id,
    qty: input.qty,
    city: input.city,
    notes: input.message,
    designId: input.designId,
    actorRole: "PUBLIC",
    source: "public_quote",
  });
}

export async function repeatOrder(input: {
  sourceOrderId: string;
  qty: number;
  requestedDate?: string;
  addressId?: string;
  notes?: string;
  invoiceRef?: string;
  actorRole: Role;
  resellerId?: string | null;
  customerId?: string | null;
}) {
  const source = await prisma.order.findUnique({
    where: { id: input.sourceOrderId },
    include: {
      items: { include: { variant: { include: { product: true } } } },
      designs: true,
    },
  });
  if (!source) throw new Error("Order saknas");
  if (!source.lockedAt) throw new Error("Beställ igen kräver en bekräftad order.");
  if (input.resellerId && source.resellerId !== input.resellerId) throw new Error("Forbidden");
  if (input.customerId && source.customerId !== input.customerId) throw new Error("Forbidden");
  const item = source.items[0];
  if (!item) throw new Error("Ordern saknar rader");
  if (input.qty < item.variant.product.moq) throw new Error(`Minsta antal är ${item.variant.product.moq}`);
  const copied = lidFinishWallFromSource(source, item.variant.optionsJson);
  return createBuyerOrder({
    buyerType: source.buyerType,
    resellerId: source.resellerId,
    customerId: source.customerId,
    variantId: item.variantId,
    qty: input.qty,
    addressId: input.addressId ?? source.shippingAddressId,
    invoiceRef: input.invoiceRef ?? source.invoiceRef ?? undefined,
    requestedDate: input.requestedDate,
    notes: input.notes,
    designId: item.designId ?? source.designs[0]?.id,
    actorRole: input.actorRole,
    source: "repeat",
    sourceOrderId: source.id,
    lid: copied.lid,
    finish: copied.finish,
  });
}

export async function createResellerOrderFromDesign(input: { designId: string; resellerId: string; userId: string }) {
  const design = await prisma.design.findUnique({ where: { id: input.designId } });
  if (!design) throw new Error("Design saknas");
  const product = await prisma.product.findUnique({
    where: { id: design.productId },
    include: { variants: true },
  });
  if (!product?.variants[0] || product.category !== "PAPER_CUP") throw new Error("Endast pappersmuggar");
  const reseller = await prisma.reseller.findUnique({
    where: { id: input.resellerId },
    include: { company: { include: { addresses: true } }, customers: true },
  });
  if (!reseller) throw new Error("Återförsäljare saknas");
  let customer = reseller.customers[0];
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        resellerId: reseller.id,
        companyId: reseller.companyId,
        name: reseller.company.name,
        email: reseller.company.email,
      },
    });
  }
  const opts = JSON.parse(design.optionsJson || "{}") as { lid?: string; finish?: string };
  return createBuyerOrder({
    buyerType: "RESELLER",
    resellerId: reseller.id,
    customerId: customer.id,
    variantId: product.variants[0].id,
    qty: design.quantity,
    addressId: reseller.company.addresses[0]?.id,
    designId: design.id,
    actorRole: "RESELLER",
    source: "reseller_studio",
    lid: opts.lid,
    finish: opts.finish,
  });
}

export async function createCustomerOrderFromDesign(input: { designId: string; customerId: string }) {
  const design = await prisma.design.findUnique({ where: { id: input.designId } });
  if (!design) throw new Error("Design saknas");
  const product = await prisma.product.findUnique({
    where: { id: design.productId },
    include: { variants: true },
  });
  if (!product?.variants[0] || product.category !== "PAPER_CUP") throw new Error("Endast pappersmuggar");
  const opts = JSON.parse(design.optionsJson || "{}") as { lid?: string; finish?: string };
  return createBuyerOrder({
    buyerType: "CUSTOMER",
    customerId: input.customerId,
    variantId: product.variants[0].id,
    qty: design.quantity,
    designId: design.id,
    actorRole: "CUSTOMER",
    source: "customer_studio",
    lid: opts.lid,
    finish: opts.finish,
  });
}

export async function saveExtras(orderId: string, extras: ExtraLine[]) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order saknas");
  if (order.lockedAt) throw new Error("Ordern är låst");
  await prisma.order.update({ where: { id: orderId }, data: { extrasJson: JSON.stringify(extras) } });
}

export async function sendOrderConfirmation(input: {
  orderId: string;
  confirmedDate: string;
  repeatHorizonMonths: number | null;
  actorRole: Role;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { items: { include: { variant: { include: { product: true } } } }, artworkApprovals: true },
  });
  if (!order) throw new Error("Order saknas");
  if (order.currentStatus !== "ARTWORK_CUSTOMER_APPROVAL") throw new Error("Kunden måste godkänna korrektur först");
  if (!order.artworkApprovals.some((a) => a.kind === "CUSTOMER_FINAL")) {
    throw new Error("Kunden måste godkänna korrektur först");
  }
  const extras = parseExtras(order.extrasJson);
  const snapshot = buildPriceSnapshot({
    lines: order.items.map((i) => ({
      name: i.variant.product.name,
      qty: i.qty,
      unitPriceExVat: i.unitPriceExVat,
    })),
    extras,
  });
  const factory = await prisma.factory.findFirst({ where: { isActive: true } });
  const deadline = addLeadTimeDays(10);
  await prisma.order.update({
    where: { id: order.id },
    data: {
      confirmedDate: input.confirmedDate,
      aquaApprovedDelivery: input.confirmedDate,
      repeatHorizonMonths: input.repeatHorizonMonths,
      priceSnapshotJson: JSON.stringify(snapshot),
      lockedAt: new Date(),
      factoryDeadline: deadline,
      factoryId: order.factoryId ?? factory?.id,
    },
  });
  await advanceOrder(order.id, "CONFIRMED", input.actorRole, "ob");
  if (input.repeatHorizonMonths && input.repeatHorizonMonths > 0) {
    const { createLeadForOrder } = await import("./lead.service");
    await createLeadForOrder(order.id, input.repeatHorizonMonths);
  }
  await prisma.document.create({
    data: {
      orderId: order.id,
      entityType: "ORDER",
      entityId: order.id,
      kind: "ORDER",
      title: `Orderbekräftelse ${order.orderNo}`,
      storageKey: `orders/${order.orderNo}.pdf`,
    },
  });
}

export function orderValue(order: {
  items: { qty: number; unitPriceExVat: number }[];
  extrasJson?: string | null;
  priceSnapshotJson?: string | null;
}) {
  if (order.priceSnapshotJson) {
    try {
      return (JSON.parse(order.priceSnapshotJson) as { amountExVat: number }).amountExVat;
    } catch {
      /* fall through */
    }
  }
  const goods = order.items.reduce((s, i) => s + i.unitPriceExVat * i.qty, 0);
  return Math.round((goods + parseExtras(order.extrasJson).reduce((s, e) => s + e.amountExVat, 0)) * 100) / 100;
}

export function assertBuyerCanAccess(order: { resellerId: string | null; customerId: string; buyerType: string }, user: { role?: string; resellerId?: string | null; customerId?: string | null }) {
  if (user.role === "AQUA_STAFF" || user.role === "AQUA_ADMIN") return;
  if (user.role === "RESELLER" && order.resellerId && order.resellerId === user.resellerId) return;
  if (user.role === "CUSTOMER" && order.customerId === user.customerId) return;
  throw new Error("Forbidden");
}
