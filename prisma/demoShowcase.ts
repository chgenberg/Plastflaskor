import {
  DocumentKind,
  OrderStatus,
  PrismaClient,
  Role,
  type PriceList,
  type Product,
  type ProductVariant,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { renderSimplePdf } from "../src/server/pdf/simplePdf";
import { putLocalFile } from "../src/server/storage/local";

const DEMO_PASSWORD = "AquaDemo26!";

const STATUSES: OrderStatus[] = [
  "SUBMITTED",
  "AQUA_REVIEW",
  "ARTWORK_AQUA_REVIEW",
  "ARTWORK_CUSTOMER_APPROVAL",
  "CONFIRMED",
  "LABEL_PRODUCTION",
  "LABELS_DISPATCHED",
  "LABELS_RECEIVED",
  "PRODUCTION_SCHEDULED",
  "IN_PRODUCTION",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "READY_TO_INVOICE",
  "INVOICED",
  "PAID",
];

type ShowcaseSpec = {
  orderNo: string;
  status: OrderStatus;
  qty: number;
  owner: "customer" | "pipeline";
  invoiceRef: string;
};

const CUSTOMER_SHOW: ShowcaseSpec[] = [
  { orderNo: "AV-SHOW-01", status: "SUBMITTED", qty: 1080, owner: "customer", invoiceRef: "Mässa höst" },
  { orderNo: "AV-SHOW-02", status: "AQUA_REVIEW", qty: 540, owner: "customer", invoiceRef: "Kickoff" },
  { orderNo: "AV-SHOW-03", status: "ARTWORK_AQUA_REVIEW", qty: 2500, owner: "customer", invoiceRef: "Sommar" },
  { orderNo: "AV-SHOW-04", status: "ARTWORK_CUSTOMER_APPROVAL", qty: 1080, owner: "customer", invoiceRef: "Korrektur" },
  { orderNo: "AV-SHOW-05", status: "CONFIRMED", qty: 2700, owner: "customer", invoiceRef: "OB låst" },
  { orderNo: "AV-SHOW-06", status: "LABEL_PRODUCTION", qty: 2500, owner: "customer", invoiceRef: "Etikett" },
  { orderNo: "AV-SHOW-07", status: "LABELS_DISPATCHED", qty: 1080, owner: "customer", invoiceRef: "På väg till tappning" },
  { orderNo: "AV-SHOW-08", status: "IN_PRODUCTION", qty: 2500, owner: "customer", invoiceRef: "Tappning" },
  { orderNo: "AV-SHOW-09", status: "READY_TO_SHIP", qty: 540, owner: "customer", invoiceRef: "Klar att skicka" },
  { orderNo: "AV-SHOW-10", status: "SHIPPED", qty: 1080, owner: "customer", invoiceRef: "Leverans" },
  { orderNo: "AV-SHOW-11", status: "DELIVERED", qty: 2500, owner: "customer", invoiceRef: "Mottagen" },
  { orderNo: "AV-SHOW-12", status: "READY_TO_INVOICE", qty: 1080, owner: "customer", invoiceRef: "Att fakturera" },
  { orderNo: "AV-SHOW-13", status: "INVOICED", qty: 2500, owner: "customer", invoiceRef: "Faktura öppen" },
  { orderNo: "AV-SHOW-14", status: "PAID", qty: 1080, owner: "customer", invoiceRef: "Betald" },
  { orderNo: "AV-SHOW-15", status: "CONFIRMED", qty: 1080, owner: "customer", invoiceRef: "Julbord" },
  { orderNo: "AV-SHOW-16", status: "LABEL_PRODUCTION", qty: 2500, owner: "customer", invoiceRef: "Kickoff vår" },
  { orderNo: "AV-SHOW-17", status: "LABEL_PRODUCTION", qty: 540, owner: "customer", invoiceRef: "Mässa Malmö" },
  { orderNo: "AV-SHOW-18", status: "LABELS_RECEIVED", qty: 1080, owner: "customer", invoiceRef: "Inleverans" },
  { orderNo: "AV-SHOW-19", status: "PRODUCTION_SCHEDULED", qty: 2500, owner: "customer", invoiceRef: "Vecka 38" },
  { orderNo: "AV-SHOW-20", status: "IN_PRODUCTION", qty: 1080, owner: "customer", invoiceRef: "Tappning 2" },
];

const PIPELINE_SHOW: ShowcaseSpec[] = STATUSES.map((status, i) => ({
  orderNo: `AV-PIPE-${String(i + 1).padStart(2, "0")}`,
  status,
  qty: [540, 1080, 2500, 5000][i % 4],
  owner: "pipeline" as const,
  invoiceRef: `PIPE-${i + 1}`,
}));

function idx(status: OrderStatus) {
  return STATUSES.indexOf(status);
}

function visual(name: string, qty: number, volumeMl: number | null, waterType: string) {
  return {
    productName: name,
    qty,
    volumeLabel: volumeMl ? `${Math.round(volumeMl / 10)} CL` : "33 CL",
    waterType: waterType.includes("kolsyr") ? "KOLSYRAT" : "STILLA",
    bottleColor: "TRANSPARENT FLASKA",
    cap: "SVART KAPSYL",
    labelMaterial: qty >= 2500 ? "Transparent" : "Vit",
  };
}

function snapshot(name: string, qty: number, lockedAt: Date) {
  const goods = Math.round(qty * 3.1 * 100) / 100;
  const extras = 450;
  const ex = Math.round((goods + extras) * 100) / 100;
  return {
    lines: [{ name, qty, unitPriceExVat: 3.1, lineExVat: goods }],
    extras: [{ kind: "freight", label: "Frakt", amountExVat: extras }],
    extrasExVat: extras,
    goodsExVat: goods,
    amountExVat: ex,
    vatAmount: Math.round(ex * 0.25 * 100) / 100,
    amountIncVat: Math.round(ex * 1.25 * 100) / 100,
    lockedAt: lockedAt.toISOString(),
  };
}

export async function ensureDemoShowcase(prisma: PrismaClient) {
  if (process.env.AQUA_DEMO_FIXTURES === "0") {
    console.log("Demo-showcase avstängd (AQUA_DEMO_FIXTURES=0).");
    return;
  }
  const ctx = await bootstrapDemoWorld(prisma);
  if (!ctx) {
    console.warn("Demo-showcase: kunde inte skapa grunddata.");
    return;
  }

  for (const spec of CUSTOMER_SHOW) {
    await ensureShowcaseOrder(prisma, ctx, spec, ctx.customerId, ctx.customerAddrId);
  }

  for (const spec of PIPELINE_SHOW) {
    await ensureShowcaseOrder(prisma, ctx, spec, ctx.pipelineCustomerId, ctx.pipelineAddrId);
  }

  await enrichSupplierFacing(prisma, ctx);
  await ensureSupplierReports(prisma, ctx);
  await ensureCustomerDesigns(prisma, ctx);
  await ensureQuoteInbox(prisma, ctx);
  await ensureStaffPings(prisma, ctx);

  await prisma.order.updateMany({
    where: {
      orderNo: { startsWith: "AV-K-" },
      customerId: { not: ctx.customerId },
    },
    data: { customerId: ctx.customerId, shippingAddressId: ctx.customerAddrId, buyerType: "CUSTOMER" },
  });

  const kundOrders = await prisma.order.count({ where: { customerId: ctx.customerId } });
  const invoices = await prisma.invoice.count({ where: { customerId: ctx.customerId } });
  console.log(`Demo-showcase klar: ${kundOrders} ordrar hos kund@, ${invoices} fakturor, artwork på etikett/bottler.`);
}

type DemoCtx = {
  customerId: string;
  customerAddrId: string;
  customerUserId: string;
  pipelineCustomerId: string;
  pipelineAddrId: string;
  staffId: string;
  adminId: string;
  bottlerId: string;
  labelId: string;
  product: Product & { variants: ProductVariant[] };
  variant: ProductVariant;
};

async function bootstrapDemoWorld(prisma: PrismaClient): Promise<DemoCtx | null> {
  const lists = await ensurePriceLists(prisma);
  const product = await ensureWaterProduct(prisma, lists.STANDARD.id);
  const variant = product.variants[0];
  if (!variant) return null;

  const bottler = await ensureFactory(prisma, {
    orgNr: "559801-1001",
    companyName: "AquaFill Göteborg AB",
    email: "gbg@aquafill.se",
    factoryName: "Tollagården Tappning",
    code: "BOT",
    kind: "bottler",
    line1: "Källvägen 4",
    postalCode: "795 32",
    city: "Rättvik",
  });
  const label = await ensureFactory(prisma, {
    orgNr: "559801-1002",
    companyName: "AquaFill Örebro AB",
    email: "orebro@aquafill.se",
    factoryName: "LabelPrint Göteborg",
    code: "LBL",
    kind: "label",
    line1: "Etikettgatan 8",
    postalCode: "417 56",
    city: "Göteborg",
  });

  const aqua =
    (await prisma.company.findFirst({ where: { orgNr: "556800-2048" } })) ??
    (await prisma.company.create({
      data: { orgNr: "556800-2048", name: "Aqua Visibility AB", email: "info@aquavisibility.se", phone: "08-400 204 80" },
    }));

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const staff = await upsertUser(prisma, {
    email: "staff@demo.aqua",
    name: "Alex Operations",
    role: "AQUA_ADMIN",
    passwordHash,
    companyId: aqua.id,
  });
  const admin = await upsertUser(prisma, {
    email: "admin@demo.aqua",
    name: "Joakim Admin",
    role: "AQUA_ADMIN",
    passwordHash,
    companyId: aqua.id,
  });
  await upsertUser(prisma, {
    email: "bottler@demo.aqua",
    name: "Kim Bottler",
    role: "BOTTLER",
    passwordHash,
    companyId: bottler.companyId,
    factoryId: bottler.id,
  });
  await upsertUser(prisma, {
    email: "labels@demo.aqua",
    name: "Liv Etikett",
    role: "LABEL",
    passwordHash,
    companyId: label.companyId,
    factoryId: label.id,
  });

  const directCo =
    (await prisma.company.findFirst({ where: { orgNr: "559888-0101" } })) ??
    (await prisma.company.create({
      data: { orgNr: "559888-0101", name: "Fikastunden Direkt AB", email: "kund@demo.aqua" },
    }));
  const directCustomer =
    (await prisma.customer.findFirst({ where: { orgNr: "559888-0101" } })) ??
    (await prisma.customer.create({
      data: {
        companyId: directCo.id,
        priceListId: lists.STANDARD.id,
        name: "Fikastunden Direkt AB",
        orgNr: "559888-0101",
        email: "kund@demo.aqua",
      },
    }));
  const directAddr =
    (await prisma.address.findFirst({ where: { customerId: directCustomer.id, type: "SHIPPING" } })) ??
    (await prisma.address.create({
      data: {
        customerId: directCustomer.id,
        type: "SHIPPING",
        line1: "Kungsgatan 1",
        postalCode: "411 19",
        city: "Göteborg",
      },
    }));
  const kund = await upsertUser(prisma, {
    email: "kund@demo.aqua",
    name: "Sara Kund",
    role: "CUSTOMER",
    passwordHash,
    companyId: directCo.id,
    customerId: directCustomer.id,
  });

  const pipeline =
    (await prisma.customer.findFirst({ where: { name: "Sprintlöparna IF" } })) ??
    (await prisma.customer.create({
      data: {
        priceListId: lists.STANDARD.id,
        name: "Sprintlöparna IF",
        orgNr: "559900-0102",
        email: "kontakt@kund2.se",
      },
    }));
  const pipelineAddr =
    (await prisma.address.findFirst({ where: { customerId: pipeline.id, type: "SHIPPING" } })) ??
    (await prisma.address.create({
      data: {
        customerId: pipeline.id,
        type: "SHIPPING",
        line1: "Storgatan 1",
        postalCode: "111 22",
        city: "Göteborg",
      },
    }));

  return {
    customerId: directCustomer.id,
    customerAddrId: directAddr.id,
    customerUserId: kund.id,
    pipelineCustomerId: pipeline.id,
    pipelineAddrId: pipelineAddr.id,
    staffId: staff.id,
    adminId: admin.id,
    bottlerId: bottler.id,
    labelId: label.id,
    product,
    variant,
  };
}

async function ensurePriceLists(prisma: PrismaClient) {
  const wanted = [
    ["STANDARD", "Standard"],
    ["SILVER", "Silver"],
    ["GOLD", "Gold"],
    ["SPECIAL", "Special Agreement"],
  ] as const;
  const out = {} as Record<(typeof wanted)[number][0], PriceList>;
  for (const [code, name] of wanted) {
    out[code] =
      (await prisma.priceList.findUnique({ where: { code } })) ??
      (await prisma.priceList.create({ data: { code, name } }));
  }
  return out;
}

async function ensureWaterProduct(prisma: PrismaClient, priceListId: string) {
  const existing = await prisma.product.findFirst({
    where: { category: "WATER", isPublic: true },
    include: { variants: true },
    orderBy: { sortOrder: "asc" },
  });
  if (existing?.variants.length) return existing;

  const product = await prisma.product.create({
    data: {
      slug: "naturligt-mineralvatten-33cl",
      skuBase: "vatten-33cl",
      name: "Naturligt Mineralvatten 33cl – egen etikett",
      category: "WATER",
      categorySlug: "profilvatten",
      oneLiner: "Vårt populära profilvatten med egen etikett tappas ur Tollagårdens friska källa!",
      body: "Svenskt naturligt mineralvatten med egen etikett.",
      specText: "MOQ: 270st",
      moq: 270,
      leadTimeText: "Normalt tre veckor.",
      country: "Sverige",
      environmentText: "Pantsymbol och streckkod.",
      sortOrder: 1,
      variants: {
        create: [
          { sku: "vatten-33cl-stilla", name: "33 cl stilla", volumeMl: 330, optionsJson: JSON.stringify({ waterType: "stilla" }) },
          { sku: "vatten-33cl-kolsyra", name: "33 cl kolsyrat", volumeMl: 330, optionsJson: JSON.stringify({ waterType: "kolsyrat" }) },
        ],
      },
    },
    include: { variants: true },
  });
  for (const variant of product.variants) {
    await prisma.priceListItem.create({
      data: { priceListId, variantId: variant.id, minQty: 270, unitPriceExVat: 6.4 },
    }).catch(() => undefined);
  }
  return product;
}

async function ensureFactory(
  prisma: PrismaClient,
  input: {
    orgNr: string;
    companyName: string;
    email: string;
    factoryName: string;
    code: string;
    kind: string;
    line1: string;
    postalCode: string;
    city: string;
  },
) {
  const existing = await prisma.factory.findUnique({ where: { code: input.code } });
  if (existing) {
    if (existing.kind !== input.kind) {
      return prisma.factory.update({ where: { id: existing.id }, data: { kind: input.kind } });
    }
    return existing;
  }
  const company =
    (await prisma.company.findFirst({ where: { orgNr: input.orgNr } })) ??
    (await prisma.company.create({ data: { orgNr: input.orgNr, name: input.companyName, email: input.email } }));
  const address = await prisma.address.create({
    data: {
      companyId: company.id,
      type: "SHIPPING",
      line1: input.line1,
      postalCode: input.postalCode,
      city: input.city,
    },
  });
  return prisma.factory.create({
    data: {
      companyId: company.id,
      name: input.factoryName,
      code: input.code,
      kind: input.kind,
      addressId: address.id,
    },
  });
}

async function upsertUser(
  prisma: PrismaClient,
  data: {
    email: string;
    name: string;
    role: Role;
    passwordHash: string;
    companyId?: string;
    factoryId?: string;
    customerId?: string;
  },
) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        role: data.role,
        passwordHash: data.passwordHash,
        isActive: true,
        companyId: data.companyId ?? existing.companyId,
        factoryId: data.factoryId ?? existing.factoryId,
        customerId: data.customerId ?? existing.customerId,
      },
    });
  }
  return prisma.user.create({ data });
}

async function ensureShowcaseOrder(
  prisma: PrismaClient,
  ctx: DemoCtx,
  spec: ShowcaseSpec,
  customerId: string,
  shippingAddressId: string,
) {
  const existing = await prisma.order.findUnique({ where: { orderNo: spec.orderNo } });
  const status = existing?.currentStatus ?? spec.status;
  const step = idx(status);
  const locked = step >= 4;
  const createdAt = existing?.createdAt ?? new Date(2026, 6, 4 + idx(spec.status));
  const opt = JSON.parse(ctx.variant.optionsJson || "{}") as { waterType?: string };
  const vis = visual(ctx.product.name, spec.qty, ctx.variant.volumeMl, opt.waterType ?? "stilla");

  const order = existing
    ? existing.customerId === customerId
      ? existing
      : await prisma.order.update({
          where: { id: existing.id },
          data: { customerId, shippingAddressId, buyerType: "CUSTOMER" },
        })
    : await prisma.order.create({
        data: {
          orderNo: spec.orderNo,
          buyerType: "CUSTOMER",
          customerId,
          shippingAddressId,
          source: "customer_order",
          createdAt,
          currentStatus: spec.status,
          invoiceRef: spec.invoiceRef,
          requestedDate: "2026-09-18",
          preliminaryDate: "2026-09-25",
          confirmedDate: locked ? "2026-09-26" : null,
          aquaApprovedDelivery: step >= 9 ? "2026-09-28" : null,
          lockedAt: locked ? createdAt : null,
          factoryId: ctx.bottlerId,
          factoryDeadline: locked ? "2026-09-12" : null,
          factoryDeadlineAccepted: step >= 5,
          extrasJson: locked ? JSON.stringify([{ kind: "freight", label: "Frakt", amountExVat: 450 }]) : "[]",
          priceSnapshotJson: locked ? JSON.stringify(snapshot(ctx.product.name, spec.qty, createdAt)) : null,
          visualSpecJson: JSON.stringify(vis),
          repeatHorizonMonths: locked ? 12 : null,
          items: {
            create: {
              variantId: ctx.variant.id,
              qty: spec.qty,
              unitPriceExVat: 3.1,
              visualSpecJson: JSON.stringify(vis),
            },
          },
        },
      });

  await ensureJobs(prisma, order.id, ctx, step);
  await ensureHistory(prisma, order.id, status, createdAt);
  await ensureDocsAndArtwork(prisma, order.id, spec.orderNo, status, customerId, spec.qty, ctx);
  if (locked && spec.owner === "customer") {
    await ensureRepeat(prisma, order.id, customerId, spec.status);
  }
  return order;
}

async function ensureJobs(prisma: PrismaClient, orderId: string, ctx: DemoCtx, step: number) {
  const labelStatus = step >= 6 ? "DONE" : step >= 5 ? "STARTED" : "NOT_PLANNED";
  const bottlerStatus = step >= 10 ? "DONE" : step >= 9 ? "STARTED" : "NOT_PLANNED";
  for (const [factoryId, status] of [
    [ctx.labelId, labelStatus],
    [ctx.bottlerId, bottlerStatus],
  ] as const) {
    const job = await prisma.productionJob.findFirst({ where: { orderId, factoryId } });
    if (job) {
      await prisma.productionJob.update({ where: { id: job.id }, data: { status } });
    } else {
      await prisma.productionJob.create({
        data: { orderId, factoryId, status, plannedAt: new Date(2026, 7, 20) },
      });
    }
  }
}

async function ensureHistory(prisma: PrismaClient, orderId: string, status: OrderStatus, createdAt: Date) {
  const step = idx(status);
  const count = await prisma.statusEvent.count({ where: { entityType: "ORDER", entityId: orderId } });
  if (count > 0) return;
  for (let s = 0; s <= step; s++) {
    await prisma.statusEvent.create({
      data: {
        entityType: "ORDER",
        entityId: orderId,
        fromStatus: s === 0 ? null : STATUSES[s - 1],
        toStatus: STATUSES[s],
        actorRole: s < 2 ? Role.CUSTOMER : s < 5 ? Role.AQUA_STAFF : s < 7 ? Role.LABEL : Role.BOTTLER,
        source: "demo",
        occurredAt: new Date(createdAt.getTime() + s * 86400000),
      },
    });
  }
}

async function ensureDocsAndArtwork(
  prisma: PrismaClient,
  orderId: string,
  orderNo: string,
  status: OrderStatus,
  customerId: string,
  qty: number,
  ctx: DemoCtx,
) {
  const step = idx(status);
  await ensureDoc(prisma, orderId, `Orderbekräftelse ${orderNo}`, "ORDER");
  if (step >= 1) await ensureDoc(prisma, orderId, "Artwork original", "ARTWORK");
  if (step >= 4) await ensureDoc(prisma, orderId, "Slutgiltig etikett PDF", "ARTWORK");
  if (step >= 5) await ensureDoc(prisma, orderId, "Produktionsunderlag etikett", "PRODUCTION");
  if (step >= 6) {
    await ensureDoc(prisma, orderId, "Följesedel etiketter", "LOGISTICS");
    await ensureShipment(prisma, orderId, "LABELS_TO_FACTORY", `LBL${orderNo.replace(/\D/g, "")}`, step >= 7);
  }
  if (step >= 10) {
    await ensureDoc(prisma, orderId, `Fraktsedel ${orderNo}`, "WAYBILL");
    await ensureShipment(prisma, orderId, "GOODS_TO_CUSTOMER", `AV${orderNo.replace(/\D/g, "")}`, step >= 12);
  }
  if (step >= 3) {
    await ensureArtworkPack(prisma, orderId, orderNo, status, ctx);
  }
  if (step >= 14) {
    await ensureInvoice(prisma, orderId, customerId, orderNo, qty, status === "PAID");
  }
}

async function ensureDoc(prisma: PrismaClient, orderId: string, title: string, kind: DocumentKind) {
  const existing = await prisma.document.findFirst({ where: { orderId, title } });
  if (existing) return existing;
  return prisma.document.create({
    data: {
      orderId,
      entityType: "ORDER",
      entityId: orderId,
      kind,
      title,
      storageKey: `demo/${orderId}/${title.replace(/\s+/g, "-").toLowerCase()}.pdf`,
    },
  });
}

async function ensureShipment(
  prisma: PrismaClient,
  orderId: string,
  type: "LABELS_TO_FACTORY" | "GOODS_TO_CUSTOMER",
  trackingNo: string,
  delivered: boolean,
) {
  const existing = await prisma.shipment.findFirst({ where: { orderId, type } });
  if (existing) return existing;
  return prisma.shipment.create({
    data: {
      orderId,
      type,
      carrier: "PostNord",
      trackingNo,
      waybillNo: type === "GOODS_TO_CUSTOMER" ? `WB-${trackingNo}` : undefined,
      status: delivered ? "DELIVERED" : "IN_TRANSIT",
      packages: 4,
      weightKg: 180,
    },
  });
}

async function ensureArtworkPack(
  prisma: PrismaClient,
  orderId: string,
  orderNo: string,
  status: OrderStatus,
  ctx: DemoCtx,
) {
  const step = idx(status);
  let design = await prisma.design.findFirst({ where: { orderId } });
  if (!design) {
    design = await prisma.design.create({
      data: {
        orderId,
        userId: ctx.customerUserId,
        productId: ctx.product.id,
        variantId: ctx.variant.id,
        projectName: `Etikett ${orderNo}`,
        source: "customer_order",
        status: "ATTACHED_TO_ORDER",
        quantity: 1000,
        optionsJson: "{}",
      },
    });
  }
  const storageKey = `artwork/${orderNo}-final.pdf`;
  let file = await prisma.artworkFile.findFirst({ where: { designId: design.id } });
  if (!file) {
    file = await prisma.artworkFile.create({
      data: {
        designId: design.id,
        fileName: `${orderNo}-etikett.pdf`,
        mimeType: "application/pdf",
        storageKey,
        kind: "print",
        uploadedById: ctx.customerUserId,
      },
    });
  }
  const version = await prisma.artworkVersion.findFirst({ where: { orderId, title: "Slutgiltig artwork" } });
  if (!version) {
    await prisma.artworkVersion.create({
      data: {
        orderId,
        designId: design.id,
        kind: "print",
        storageKey: file.storageKey,
        title: "Slutgiltig artwork",
        isFinal: step >= 4,
      },
    });
  } else if (step >= 4 && !version.isFinal) {
    await prisma.artworkVersion.update({ where: { id: version.id }, data: { isFinal: true } });
  }
  if (step >= 3) {
    const aquaProof = await prisma.artworkApproval.findFirst({ where: { orderId, kind: "AQUA_PROOF" } });
    if (!aquaProof) {
      await prisma.artworkApproval.create({
        data: { orderId, kind: "AQUA_PROOF", actorRole: Role.AQUA_STAFF, note: "Korrektur skickat" },
      });
    }
  }
  if (step >= 4) {
    const customerFinal = await prisma.artworkApproval.findFirst({ where: { orderId, kind: "CUSTOMER_FINAL" } });
    if (!customerFinal) {
      await prisma.artworkApproval.create({
        data: { orderId, kind: "CUSTOMER_FINAL", actorRole: Role.CUSTOMER, note: "Godkänd av kund" },
      });
    }
  }
}

async function ensureInvoice(
  prisma: PrismaClient,
  orderId: string,
  customerId: string,
  orderNo: string,
  qty: number,
  paid: boolean,
) {
  const existing = await prisma.invoice.findUnique({ where: { orderId } });
  const amountExVat = Math.round((qty * 3.1 + 450) * 100) / 100;
  const vatAmount = Math.round(amountExVat * 0.25 * 100) / 100;
  const invoiceNo = `F-${orderNo.replace(/[^A-Za-z0-9]+/g, "")}`;
  if (!existing) {
    await prisma.invoice.create({
      data: {
        orderId,
        customerId,
        invoiceNo,
        fortnoxId: `FX-${invoiceNo}`,
        status: paid ? "PAID" : "ISSUED",
        amountExVat,
        vatAmount,
        amountIncVat: Math.round((amountExVat + vatAmount) * 100) / 100,
        issuedAt: new Date(2026, 7, 1),
        dueAt: new Date(2026, 7, 31),
        paidAt: paid ? new Date(2026, 7, 12) : null,
      },
    });
  }
  await ensureDoc(prisma, orderId, `Faktura ${invoiceNo}`, "FINANCE");
}

async function ensureRepeat(prisma: PrismaClient, orderId: string, customerId: string, status: OrderStatus) {
  const existing = await prisma.repeatOpportunity.findFirst({ where: { sourceOrderId: orderId } });
  if (existing) return;
  const soon = ["SHIPPED", "DELIVERED", "INVOICED", "PAID", "READY_TO_INVOICE"].includes(status);
  const expectedAt = new Date();
  expectedAt.setDate(expectedAt.getDate() + (soon ? 4 : 21));
  const activateAt = new Date();
  activateAt.setDate(activateAt.getDate() - 3);
  await prisma.repeatOpportunity.create({
    data: {
      sourceOrderId: orderId,
      customerId,
      expectedAt,
      activateAt,
      status: soon ? "ACTIVE" : "UPCOMING",
    },
  });
}

async function enrichSupplierFacing(prisma: PrismaClient, ctx: DemoCtx) {
  const jobs = await prisma.order.findMany({
    where: {
      currentStatus: {
        in: [
          "CONFIRMED",
          "LABEL_PRODUCTION",
          "LABELS_DISPATCHED",
          "LABELS_RECEIVED",
          "PRODUCTION_SCHEDULED",
          "IN_PRODUCTION",
          "READY_TO_SHIP",
          "SHIPPED",
        ],
      },
    },
    select: { id: true, orderNo: true, currentStatus: true, customerId: true, items: { select: { qty: true } } },
  });
  for (const order of jobs) {
    await ensureDocsAndArtwork(
      prisma,
      order.id,
      order.orderNo,
      order.currentStatus,
      order.customerId,
      order.items[0]?.qty ?? 1080,
      ctx,
    );
    await ensureJobs(prisma, order.id, ctx, idx(order.currentStatus));
  }
}

async function ensureSupplierReports(prisma: PrismaClient, _ctx: DemoCtx) {
  const dispatched = await prisma.order.findFirst({
    where: { orderNo: "AV-SHOW-07" },
    include: {
      customer: { select: { name: true } },
      items: { include: { variant: { include: { product: true } } } },
      jobs: { include: { factory: true } },
    },
  });
  const labelJob = dispatched?.jobs.find((j) => j.factory.kind === "label");
  if (dispatched && labelJob && !(await prisma.labelDispatch.findFirst({ where: { reportNo: "LR-2026-0001" } }))) {
    const qty = dispatched.items.reduce((sum, item) => sum + item.qty, 0);
    const dispatch = await prisma.labelDispatch.create({
      data: {
        reportNo: "LR-2026-0001",
        factoryId: labelJob.factoryId,
        trackingNo: "JJFI123456789SE",
        notes: "Demo — etiketter till Tollagården.",
        lines: { create: [{ jobId: labelJob.id, orderId: dispatched.id, qty }] },
      },
    });
    const pdf = renderSimplePdf(`Leveransrapport ${dispatch.reportNo}`, [
      "Fakturaunderlag för etikettleverans till bottler.",
      `Datum: ${new Date().toLocaleDateString("sv-SE")}`,
      "Tracking: JJFI123456789SE",
      `Anteckning: Demo — etiketter till Tollagården.`,
      "",
      `${dispatched.orderNo}  ${dispatched.customer.name}  ${qty} st`,
      "",
      "Ingen pris- eller fakturainformation.",
    ]);
    const storageKey = `label-dispatches/${dispatch.reportNo}.pdf`;
    await putLocalFile(storageKey, pdf);
    await prisma.document.create({
      data: {
        orderId: dispatched.id,
        entityType: "LABEL_DISPATCH",
        entityId: dispatch.id,
        kind: "LOGISTICS",
        title: `Leveransrapport ${dispatch.reportNo}`,
        storageKey,
      },
    });
  }

  const shipped = await prisma.order.findFirst({
    where: { orderNo: "AV-SHOW-10" },
    include: {
      customer: { select: { name: true } },
      items: { include: { variant: { include: { product: true } } } },
      jobs: { include: { factory: true } },
      shipments: true,
    },
  });
  const bottlerJob = shipped?.jobs.find((j) => j.factory.kind === "bottler");
  if (shipped && bottlerJob && !(await prisma.bottlerInvoiceReport.findFirst({ where: { reportNo: "BF-2026-0001" } }))) {
    const qty = shipped.items.reduce((sum, item) => sum + item.qty, 0);
    const report = await prisma.bottlerInvoiceReport.create({
      data: {
        reportNo: "BF-2026-0001",
        factoryId: bottlerJob.factoryId,
        notes: "Demo — tappning skickad.",
        lines: {
          create: [
            {
              jobId: bottlerJob.id,
              orderId: shipped.id,
              qty,
              size: "33 cl",
              water: "Stilla",
              cap: "Svart",
              trackingNo: shipped.shipments.find((s) => s.type === "GOODS_TO_CUSTOMER")?.trackingNo ?? "DEMO-SHIP-10",
            },
          ],
        },
      },
    });
    const pdf = renderSimplePdf(`Fakturaunderlag ${report.reportNo}`, [
      "Underlag för bottler att fakturera tappning. Inga priser.",
      `Datum: ${new Date().toLocaleDateString("sv-SE")}`,
      `${shipped.orderNo}  ${shipped.customer.name}  ${qty} st`,
      "",
      "Ingen pris- eller fakturainformation.",
    ]);
    const storageKey = `bottler-invoices/${report.reportNo}.pdf`;
    await putLocalFile(storageKey, pdf);
    await prisma.document.create({
      data: {
        orderId: shipped.id,
        entityType: "BOTTLER_INVOICE",
        entityId: report.id,
        kind: "LOGISTICS",
        title: `Fakturaunderlag ${report.reportNo}`,
        storageKey,
      },
    });
  }
}

async function ensureCustomerDesigns(prisma: PrismaClient, ctx: DemoCtx) {
  const count = await prisma.design.count({ where: { userId: ctx.customerUserId } });
  if (count >= 3) return;
  const names = ["Sara sommar", "Fikastunden mässa", "Julkampanj 2026"];
  for (const projectName of names) {
    const exists = await prisma.design.findFirst({ where: { userId: ctx.customerUserId, projectName } });
    if (exists) continue;
    await prisma.design.create({
      data: {
        userId: ctx.customerUserId,
        productId: ctx.product.id,
        variantId: ctx.variant.id,
        projectName,
        source: "studio",
        status: "SUBMITTED",
        quantity: 1080,
        optionsJson: "{}",
        files: {
          create: {
            fileName: `${projectName.replace(/\s+/g, "-").toLowerCase()}.pdf`,
            mimeType: "application/pdf",
            storageKey: `artwork/${projectName.replace(/\s+/g, "-").toLowerCase()}.pdf`,
            kind: "original",
            uploadedById: ctx.customerUserId,
          },
        },
      },
    });
  }
}

async function ensureQuoteInbox(prisma: PrismaClient, ctx: DemoCtx) {
  const existing = await prisma.notification.findFirst({
    where: { userId: ctx.staffId, type: "quote", body: { contains: "Nordic Events" } },
  });
  if (existing) return;
  const quotes = [
    {
      title: "Offertförfrågan",
      body: "Nordic Events AB · hello@nordicevents.se · Naturligt Mineralvatten 33cl – egen etikett · 2 500 st · Stockholm · Kickoff i oktober",
    },
    {
      title: "Offertförfrågan",
      body: "Havtorn Media AB · inköp@havtorn.se · Naturligt Mineralvatten 50cl – egen etikett · 1 080 st · Göteborg",
    },
  ];
  for (const userId of [ctx.staffId, ctx.adminId]) {
    await prisma.notification.createMany({
      data: quotes.map((q) => ({
        userId,
        type: "quote",
        title: q.title,
        body: q.body,
        entityType: "QUOTE",
        entityId: "demo-quote",
      })),
    });
  }
}

async function ensureStaffPings(prisma: PrismaClient, ctx: DemoCtx) {
  const existing = await prisma.notification.findFirst({
    where: { userId: ctx.staffId, type: "artwork", title: "Artwork behöver godkännas" },
  });
  if (existing) return;
  const waiting = await prisma.order.findFirst({ where: { currentStatus: "ARTWORK_AQUA_REVIEW" } });
  if (!waiting) return;
  await prisma.notification.create({
    data: {
      userId: ctx.staffId,
      type: "artwork",
      title: "Artwork behöver godkännas",
      body: `${waiting.orderNo} väntar på godkännande.`,
      entityType: "ORDER",
      entityId: waiting.id,
    },
  });
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await ensureDemoShowcase(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.includes("demoShowcase")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
