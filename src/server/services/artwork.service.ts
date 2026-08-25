import { Role } from "@prisma/client";
import { prisma } from "../db";
import { putLocalFile } from "../storage/local";
import { getIntegrations } from "../integrations/composition";
import { advanceOrder } from "./order.service";

export async function uploadArtworkForOrder(input: {
  orderId: string;
  userId: string;
  role: string;
  resellerId?: string | null;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { items: { include: { variant: true } }, designs: true },
  });
  if (!order) throw new Error("Order saknas");
  if (input.role === "RESELLER" && order.resellerId !== input.resellerId) throw new Error("Forbidden");
  if (input.role === "FACTORY") throw new Error("Forbidden");
  const item = order.items[0];
  let design = order.designs[0];
  if (!design) {
    design = await prisma.design.create({
      data: {
        orderId: order.id,
        productId: item.variant.productId,
        variantId: item.variantId,
        projectName: `${order.orderNo} artwork`,
        source: "reseller_order",
        quantity: item.qty,
        optionsJson: item.variant.optionsJson,
        userId: input.userId,
        status: "SUBMITTED",
      },
    });
  }
  const safe = input.fileName.replace(/[^\wåäöÅÄÖ.-]+/g, "_");
  const storageKey = `artwork/${design.id}/${Date.now()}-${safe}`;
  await putLocalFile(storageKey, input.bytes);
  const file = await prisma.artworkFile.create({
    data: {
      designId: design.id,
      fileName: input.fileName,
      mimeType: input.mimeType || "application/octet-stream",
      storageKey,
      kind: "original",
      uploadedById: input.userId,
    },
  });
  if (order.currentStatus === "ORDER_RECEIVED") {
    await advanceOrder(order.id, "ARTWORK_UPLOADED", input.role as Role, "artwork");
  }
  await prisma.design.update({ where: { id: design.id }, data: { status: "SUBMITTED", orderId: order.id } });
  return file;
}

export async function approveArtwork(orderId: string, role: Role) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order saknas");
  if (order.currentStatus !== "ARTWORK_UPLOADED") throw new Error("Inget artwork att godkänna");
  await advanceOrder(orderId, "ARTWORK_APPROVED", role, "ops");
  await getIntegrations().email.sendArtworkApproval(orderId);
}

export async function confirmDelivery(orderId: string, role: Role) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order saknas");
  if (order.currentStatus !== "SHIPPED_TO_END_CUSTOMER") throw new Error("Ordern är inte skickad");
  await prisma.shipment.updateMany({
    where: { orderId, type: "GOODS_TO_CUSTOMER" },
    data: { status: "DELIVERED", deliveredAt: new Date() },
  });
  await advanceOrder(orderId, "DELIVERED", role, "shipment");
  await advanceOrder(orderId, "READY_TO_INVOICE", role, "system");
  await getIntegrations().email.sendDeliveryNotice(orderId);
}
