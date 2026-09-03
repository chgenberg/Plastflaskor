import { after } from "next/server";
import { BuyerType, InvoiceStatus, OrderStatus, Role } from "@prisma/client";
import { isAquaAdmin } from "@/domain/policies/roles";
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
import { parseBottleOptions } from "@/domain/bottleCatalog";
import { emailPausedFromEnv } from "@/lib/orchestrator/approvals";

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
  size?: "33" | "50";
  waterType?: "stilla" | "kolsyrat";
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
  const volumeMl = filters?.size === "33" ? 330 : filters?.size === "50" ? 500 : undefined;
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
        { customer: { users: { some: { OR: [{ name: { contains: q } }, { email: { contains: q } }] } } } },
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
    if (filters?.waterType) {
      const bottle = parseBottleOptions(o.items[0]?.variant.optionsJson);
      if (bottle.waterType !== filters.waterType) return false;
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

async function resolvePrice(input: { customerId: string; variantId: string; qty: number }) {
  const list = await getPriceListForBuyer(input);
  const price = resolveUnitPrice(list?.items ?? [], input.variantId, input.qty);
  if (!price) throw new Error("Kontakta oss för pris");
  return price;
}

function bottleOptsFromSource(
  source: { cupDocumentJson: string | null; visualSpecJson: string | null },
  variantOptionsJson: string,
) {
  const opt = parseBottleOptions(variantOptionsJson);
  const spec = parseVisualSpec(source.visualSpecJson);
  if (spec) {
    return {
      waterType: spec.waterType === "KOLSYRAT" ? ("kolsyrat" as const) : opt.waterType,
      cap: spec.cap.includes("SPORT") ? ("sportkork" as const) : spec.cap.includes("VIT") ? ("white" as const) : opt.cap,
      color: spec.bottleColor.includes("FROST") ? ("frost" as const) : spec.bottleColor.includes("SVART") ? ("black" as const) : opt.color,
    };
  }
  return opt;
}

function specFor(
  variant: { name: string; volumeMl: number | null; optionsJson: string; product: { name: string; slug: string } },
  qty: number,
  extra?: { waterType?: string; cap?: string; color?: string },
) {
  const merged = { ...parseBottleOptions(variant.optionsJson), ...extra };
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
  waterType?: string;
  cap?: string;
  color?: string;
  designId?: string;
  actorRole: Role;
  source?: string;
  sourceOrderId?: string;
  clientToken?: string;
}) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: input.variantId },
    include: { product: { include: { printRequirements: true } } },
  });
  if (!variant || variant.product.category !== "WATER") throw new Error("Endast profilvatten kan beställas");
  if (input.qty < variant.product.moq) throw new Error(`Minsta antal är ${variant.product.moq}`);

  const price = await resolvePrice({
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

  const bottler = await prisma.factory.findFirst({ where: { kind: "bottler", isActive: true } });
  const labelFactory = await prisma.factory.findFirst({ where: { kind: "label", isActive: true } });
  const factory = bottler ?? (await prisma.factory.findFirst({ where: { isActive: true } }));
  const bottleOpt = {
    ...parseBottleOptions(variant.optionsJson),
    ...(input.waterType ? { waterType: input.waterType as "stilla" | "kolsyrat" } : {}),
    ...(input.cap ? { cap: input.cap as "skruvkork" | "sportkork" | "black" | "white" } : {}),
    ...(input.color ? { color: input.color as "transparent" | "frost" | "black" } : {}),
  };
  const visual = specFor(variant, input.qty, bottleOpt);
  const design = input.designId
    ? await prisma.design.findUnique({ where: { id: input.designId } })
    : null;
  const fromDesign = parseCupDocument(design?.cupDocumentJson);
  const cupDoc = fromDesign
    ? {
        ...fromDesign,
        productSlug: variant.product.slug,
        quantity: input.qty,
      }
    : emptyCupDocument({
        productSlug: variant.product.slug,
        quantity: input.qty,
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
      source: input.source ?? "customer_order",
      sourceOrderId: input.sourceOrderId,
      clientToken: input.clientToken,
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

  const jobFactories = [labelFactory, factory].filter((f, i, all) => f && all.findIndex((x) => x?.id === f.id) === i);
  for (const f of jobFactories) {
    if (!f) continue;
    await prisma.productionJob.create({
      data: { orderId: order.id, factoryId: f.id, status: "NOT_PLANNED" },
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
  try {
    after(() => sendOrderReceivedOnce(order.id));
  } catch {
    void sendOrderReceivedOnce(order.id);
  }
  return order;
}

export async function findRecentDuplicateOrder(input: {
  customerId: string;
  variantId: string;
  qty: number;
  clientToken?: string;
}) {
  if (input.clientToken) {
    const byToken = await prisma.order.findUnique({ where: { clientToken: input.clientToken } });
    if (byToken) return byToken;
  }
  const since = new Date(Date.now() - 10 * 60 * 1000);
  return prisma.order.findFirst({
    where: {
      customerId: input.customerId,
      source: "checkout",
      createdAt: { gte: since },
      items: { some: { variantId: input.variantId, qty: input.qty } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function sendOrderReceivedOnce(orderId: string) {
  if (emailPausedFromEnv()) return;
  const o = await prisma.order.findUnique({ where: { id: orderId }, select: { receivedMailSentAt: true } });
  if (!o || o.receivedMailSentAt) return;
  try {
    await getIntegrations().email.sendOrderConfirmation(orderId);
    await prisma.order.updateMany({
      where: { id: orderId, receivedMailSentAt: null },
      data: { receivedMailSentAt: new Date() },
    });
  } catch (err) {
    console.error("[order] received-mail failed", orderId, err);
  }
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
  const copied = bottleOptsFromSource(source, item.variant.optionsJson);
  return createBuyerOrder({
    buyerType: "CUSTOMER",
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
    waterType: copied.waterType,
    cap: copied.cap,
    color: copied.color,
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
  const factory = await prisma.factory.findFirst({ where: { kind: "bottler", isActive: true } });
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
  await advanceOrder(order.id, "LABEL_PRODUCTION", input.actorRole, "ob");
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
  if (isAquaAdmin(user.role)) return;
  if (user.role === "RESELLER" && order.resellerId && order.resellerId === user.resellerId) return;
  if (user.role === "CUSTOMER" && order.customerId === user.customerId) return;
  throw new Error("Forbidden");
}
