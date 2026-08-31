import { Role } from "@prisma/client";
import { prisma } from "../db";
import { putLocalFile } from "../storage/local";
import { getIntegrations } from "../integrations/composition";
import { advanceOrder } from "./order.service";
import { parseCupDocument } from "@/domain/cupDocument";

export async function uploadArtworkForOrder(input: {
  orderId: string;
  userId: string;
  role: string;
  resellerId?: string | null;
  customerId?: string | null;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}) {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { items: { include: { variant: true } }, designs: true },
  });
  if (!order) throw new Error("Order saknas");
  if (order.lockedAt) throw new Error("Ordern är godkänd och låst. Kontakta AquaVisibility för ändringar.");
  if (input.role === "RESELLER" && order.resellerId !== input.resellerId) throw new Error("Forbidden");
  if (input.role === "CUSTOMER" && order.customerId !== input.customerId) throw new Error("Forbidden");
  if (input.role === "FACTORY" || input.role === "LABEL" || input.role === "BOTTLER") throw new Error("Forbidden");
  const item = order.items[0];
  let design = order.designs[0];
  if (!design) {
    design = await prisma.design.create({
      data: {
        orderId: order.id,
        productId: item.variant.productId,
        variantId: item.variantId,
        projectName: `${order.orderNo} etikett`,
        source: "customer_order",
        quantity: item.qty,
        optionsJson: item.variant.optionsJson,
        cupDocumentJson: (() => {
          const parsed = parseCupDocument(order.cupDocumentJson);
          return parsed ? JSON.stringify(parsed) : order.cupDocumentJson ?? "{}";
        })(),
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
  await prisma.artworkVersion.create({
    data: {
      orderId: order.id,
      designId: design.id,
      kind: "original",
      storageKey,
      title: input.fileName,
    },
  });
  await prisma.design.update({ where: { id: design.id }, data: { status: "SUBMITTED", orderId: order.id } });
  if (item && !item.designId) {
    await prisma.orderItem.update({ where: { id: item.id }, data: { designId: design.id } });
  }
  return file;
}

export async function sendProof(orderId: string, role: Role) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { designs: true } });
  if (!order) throw new Error("Order saknas");
  if (order.currentStatus !== "AQUA_REVIEW" && order.currentStatus !== "ARTWORK_AQUA_REVIEW") {
    throw new Error("Ordern är inte redo för korrektur");
  }
  if (order.currentStatus === "AQUA_REVIEW") {
    await advanceOrder(orderId, "ARTWORK_AQUA_REVIEW", role, "ops");
  }
  await prisma.artworkApproval.create({
    data: { orderId, kind: "AQUA_PROOF", actorRole: role, note: "Korrektur skickat" },
  });
  await prisma.document.create({
    data: {
      orderId,
      entityType: "ORDER",
      entityId: orderId,
      kind: "PROOF",
      title: `Korrektur ${order.orderNo}`,
      storageKey: `proofs/${order.orderNo}.pdf`,
    },
  });
  const latest = await prisma.order.findUnique({ where: { id: orderId } });
  if (latest?.currentStatus === "ARTWORK_AQUA_REVIEW") {
    await advanceOrder(orderId, "ARTWORK_CUSTOMER_APPROVAL", role, "ops");
  }
  await getIntegrations().email.sendArtworkApproval(orderId);
}

export async function approveArtwork(orderId: string, role: Role) {
  return sendProof(orderId, role);
}

export async function customerApproveProof(orderId: string, role: Role) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { artworkApprovals: true },
  });
  if (!order) throw new Error("Order saknas");
  if (order.currentStatus !== "ARTWORK_CUSTOMER_APPROVAL") throw new Error("Inget korrektur att godkänna");
  if (order.artworkApprovals.some((a) => a.kind === "CUSTOMER_FINAL")) return;
  await prisma.artworkApproval.create({
    data: { orderId, kind: "CUSTOMER_FINAL", actorRole: role },
  });
  await prisma.artworkVersion.updateMany({
    where: { orderId },
    data: { isFinal: true },
  });
}

export async function confirmDelivery(orderId: string, role: Role) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order saknas");
  if (order.currentStatus !== "SHIPPED") throw new Error("Ordern är inte skickad");
  await prisma.shipment.updateMany({
    where: { orderId, type: "GOODS_TO_CUSTOMER" },
    data: { status: "DELIVERED", deliveredAt: new Date() },
  });
  await advanceOrder(orderId, "DELIVERED", role, "shipment");
  await advanceOrder(orderId, "READY_TO_INVOICE", role, "system");
  await getIntegrations().email.sendDeliveryNotice(orderId);
}
