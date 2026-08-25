import { OrderStatus, Role } from "@prisma/client";
import { prisma } from "../db";
import { getIntegrations } from "../integrations/composition";
import { resolveUnitPrice } from "./catalog.service";

export async function listOrdersForReseller(resellerId: string) {
  return prisma.order.findMany({
    where: { resellerId },
    include: {
      customer: true,
      items: { include: { variant: { include: { product: true } } } },
      shippingAddress: true,
      documents: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAllOrders(filters?: { status?: OrderStatus; q?: string; phaseStatuses?: string[] }) {
  return prisma.order.findMany({
    where: {
      ...(filters?.status ? { currentStatus: filters.status } : {}),
      ...(filters?.phaseStatuses?.length ? { currentStatus: { in: filters.phaseStatuses as OrderStatus[] } } : {}),
      ...(filters?.q
        ? {
            OR: [
              { orderNo: { contains: filters.q } },
              { customer: { name: { contains: filters.q } } },
              { reseller: { company: { name: { contains: filters.q } } } },
              { invoice: { invoiceNo: { contains: filters.q } } },
              { shipments: { some: { trackingNo: { contains: filters.q } } } },
            ],
          }
        : {}),
    },
    include: {
      customer: true,
      reseller: { include: { company: true } },
      items: { include: { variant: { include: { product: true } } } },
      shippingAddress: true,
      label: true,
      jobs: true,
      shipments: true,
      invoice: true,
      documents: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderByNo(orderNo: string) {
  return prisma.order.findUnique({
    where: { orderNo },
    include: {
      customer: true,
      reseller: { include: { company: true, priceList: true } },
      items: { include: { variant: { include: { product: true } } } },
      shippingAddress: true,
      label: true,
      jobs: { include: { factory: true } },
      shipments: true,
      invoice: true,
      documents: true,
      designs: { include: { files: true } },
    },
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
  const variant = await prisma.productVariant.findFirst({ where: { productId: input.productId } });
  if (!variant) throw new Error("Produktvariant saknas");
  const addr = await prisma.address.create({
    data: {
      type: "SHIPPING",
      line1: "Anges senare",
      postalCode: "00000",
      city: input.city ?? "Sverige",
    },
  });
  const customer = await prisma.customer.create({
    data: {
      resellerId: publicReseller.id,
      name: input.company,
      email: input.email,
      phone: input.phone,
    },
  });
  const count = await prisma.order.count();
  const orderNo = `AV-${10500 + count}`;
  const order = await prisma.order.create({
    data: {
      orderNo,
      resellerId: publicReseller.id,
      customerId: customer.id,
      currentStatus: "ORDER_RECEIVED",
      shippingAddressId: addr.id,
      source: "public_quote",
      notes: input.message,
      items: {
        create: { variantId: variant.id, qty: input.qty, unitPriceExVat: 0, designId: input.designId },
      },
    },
  });
  if (input.designId) {
    await prisma.design.update({
      where: { id: input.designId },
      data: { orderId: order.id, status: "SUBMITTED" },
    });
  }
  await prisma.statusEvent.create({
    data: {
      entityType: "ORDER",
      entityId: order.id,
      toStatus: "ORDER_RECEIVED",
      actorRole: "PUBLIC",
      source: "quote",
      payload: JSON.stringify({ email: input.email }),
    },
  });
  await getIntegrations().email.sendOrderConfirmation(order.id);
  return order;
}

export async function repeatOrder(input: {
  sourceOrderId: string;
  resellerId: string;
  qty: number;
  requestedDate: string;
  addressId?: string;
  sameArtwork: boolean;
  invoiceRef?: string;
}) {
  const source = await prisma.order.findUnique({
    where: { id: input.sourceOrderId },
    include: { items: true, designs: { include: { files: true } } },
  });
  if (!source || source.resellerId !== input.resellerId) throw new Error("Order saknas");
  const item = source.items[0];
  const reseller = await prisma.reseller.findUnique({
    where: { id: input.resellerId },
    include: { priceList: { include: { items: true } } },
  });
  const price = resolveUnitPrice(reseller?.priceList.items ?? [], item.variantId, input.qty);
  if (!price) throw new Error("Kontakta oss för pris");
  const count = await prisma.order.count();
  const order = await prisma.order.create({
    data: {
      orderNo: `AV-${10500 + count}`,
      resellerId: source.resellerId,
      customerId: source.customerId,
      currentStatus: "ORDER_RECEIVED",
      shippingAddressId: input.addressId ?? source.shippingAddressId,
      factoryId: source.factoryId,
      source: "repeat",
      sourceOrderId: source.id,
      requestedDate: input.requestedDate,
      invoiceRef: input.invoiceRef ?? source.invoiceRef,
      items: {
        create: {
          variantId: item.variantId,
          qty: input.qty,
          unitPriceExVat: price.unitPriceExVat,
          designId: input.sameArtwork ? item.designId : null,
        },
      },
    },
  });
  await prisma.statusEvent.create({
    data: {
      entityType: "ORDER",
      entityId: order.id,
      toStatus: "ORDER_RECEIVED",
      actorRole: "RESELLER",
      source: "repeat",
    },
  });
  await prisma.label.create({ data: { orderId: order.id, qty: input.qty, status: "NOT_ORDERED" } });
  if (source.factoryId) {
    await prisma.productionJob.create({
      data: { orderId: order.id, factoryId: source.factoryId, status: "NOT_PLANNED" },
    });
  }
  return order;
}
