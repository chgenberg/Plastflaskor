import { prisma } from "@/server/db";
import { notifyOrderChange } from "@/server/services/notify";
import type { IntegrationRegistry } from "../../types";

function delay(ms = 280) {
  return new Promise((r) => setTimeout(r, ms));
}

export function createMockIntegrations(): IntegrationRegistry {
  return {
    fortnox: {
      async createCustomer(input) {
        await delay();
        return { fortnoxId: `FX-${input.orgNr ?? "TEMP"}` };
      },
      async createInvoice(orderId) {
        await delay(400);
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });
        if (!order) throw new Error("Order saknas");
        let amountExVat = order.items.reduce((s, i) => s + i.unitPriceExVat * i.qty, 0);
        try {
          if (order.priceSnapshotJson) {
            amountExVat = (JSON.parse(order.priceSnapshotJson) as { amountExVat: number }).amountExVat;
          }
        } catch {
          /* keep line total */
        }
        const vatAmount = Math.round(amountExVat * 0.25 * 100) / 100;
        const invoiceNo = String(10400 + Math.floor(Math.random() * 80));
        const fortnoxId = `FX-${invoiceNo}`;
        await prisma.invoice.upsert({
          where: { orderId },
          create: {
            orderId,
            resellerId: order.resellerId,
            customerId: order.customerId,
            invoiceNo,
            fortnoxId,
            status: "ISSUED",
            amountExVat,
            vatAmount,
            amountIncVat: amountExVat + vatAmount,
            issuedAt: new Date(),
            dueAt: new Date(Date.now() + 30 * 86400000),
          },
          update: { status: "ISSUED", issuedAt: new Date(), invoiceNo, fortnoxId },
        });
        await prisma.order.update({ where: { id: orderId }, data: { currentStatus: "INVOICED" } });
        await prisma.statusEvent.create({
          data: {
            entityType: "ORDER",
            entityId: orderId,
            toStatus: "INVOICED",
            actorRole: "AQUA_STAFF",
            source: "fortnox",
          },
        });
        await prisma.document.create({
          data: {
            orderId,
            entityType: "ORDER",
            entityId: orderId,
            kind: "FINANCE",
            title: `Faktura ${invoiceNo}`,
            storageKey: `invoices/${invoiceNo}.pdf`,
          },
        });
        await notifyOrderChange(orderId, "INVOICED");
        return { invoiceNo, status: "Skickad", issuedAt: new Date().toISOString() };
      },
      async sendInvoice(invoiceNo) {
        await delay();
        return { invoiceNo, status: "Skickad" };
      },
      async getPaymentStatus(invoiceNo) {
        const inv = await prisma.invoice.findUnique({ where: { invoiceNo } });
        if (inv?.status === "PAID") return "paid";
        return "unpaid";
      },
    },
    shipment: {
      async createWaybill(input) {
        await delay(350);
        const trackingNo = `AV${String(Math.floor(1000000000 + Math.random() * 8999999999))}`;
        const shipment = await prisma.shipment.create({
          data: {
            orderId: input.orderId,
            type: "GOODS_TO_CUSTOMER",
            carrier: input.carrier,
            trackingNo,
            waybillNo: `WB-${trackingNo.slice(-6)}`,
            packages: input.packages,
            weightKg: input.weightKg,
            status: "CREATED",
          },
        });
        await prisma.statusEvent.create({
          data: {
            entityType: "ORDER",
            entityId: input.orderId,
            toStatus: "WAYBILL_READY",
            actorRole: "AQUA_STAFF",
            source: "shipment",
          },
        });
        await prisma.document.create({
          data: {
            orderId: input.orderId,
            entityType: "ORDER",
            entityId: input.orderId,
            kind: "WAYBILL",
            title: `Fraktsedel ${trackingNo}`,
            storageKey: `waybills/${trackingNo}.pdf`,
          },
        });
        await notifyOrderChange(input.orderId, "READY_TO_SHIP");
        return {
          shipmentId: shipment.id,
          trackingNo,
          carrier: input.carrier,
          labelPdfUrl: `/bottler/jobb/${input.jobId ?? "na"}/fraktsedel?tracking=${trackingNo}`,
          status: "CREATED",
        };
      },
      async getTracking(trackingNo) {
        const s = await prisma.shipment.findFirst({ where: { trackingNo } });
        return { status: (s?.status as "CREATED") ?? "CREATED", updatedAt: new Date().toISOString() };
      },
      async getDeliveryStatus(trackingNo) {
        const s = await prisma.shipment.findFirst({ where: { trackingNo } });
        return (s?.status as "CREATED") ?? "CREATED";
      },
    },
    label: {
      async orderLabels(orderId) {
        await delay();
        return { labelOrderId: orderId, status: "ORDERED" };
      },
      async getPrintStatus() {
        return "PRINTING";
      },
      async getTracking() {
        return { trackingNo: "LBL-DEMO", status: "IN_TRANSIT" };
      },
    },
    factory: {
      async submitProduction(jobId) {
        await delay();
        return { ack: `ACK-${jobId.slice(0, 6)}` };
      },
      async getProductionStatus(jobId) {
        const job = await prisma.productionJob.findUnique({ where: { id: jobId } });
        return job?.status ?? "NOT_PLANNED";
      },
      async getDeliveryStatus() {
        return "PENDING";
      },
    },
    email: {
      async sendOrderConfirmation(orderId) {
        await delay(200);
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { customer: { include: { users: true } } },
        });
        const recipients = order?.customer.users ?? [];
        if (recipients.length && order) {
          await prisma.notification.createMany({
            data: recipients.map((u) => ({
              userId: u.id,
              type: "email",
              title: "Order mottagen",
              body: `${order.orderNo} är mottagen. Slutlig OB med korrektur skickas inom 24 timmar.`,
              entityType: "ORDER",
              entityId: orderId,
            })),
          });
        }
        return { id: `mail-confirm-${orderId}` };
      },
      async sendArtworkApproval(orderId) {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { customer: { include: { users: true } } },
        });
        if (order?.customer.users.length) {
          await prisma.notification.createMany({
            data: order.customer.users.map((u) => ({
              userId: u.id,
              type: "email",
              title: "Korrektur att godkänna",
              body: `${order.orderNo}: öppna ordern och godkänn korrektur.`,
              entityType: "ORDER",
              entityId: orderId,
            })),
          });
        }
        return { id: `mail-art-${orderId}` };
      },
      async sendDeliveryNotice(orderId) {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { customer: { include: { users: true } } },
        });
        if (order?.customer.users.length) {
          await prisma.notification.createMany({
            data: order.customer.users.map((u) => ({
              userId: u.id,
              type: "email",
              title: "Ordern är skickad",
              body: `${order.orderNo}: följ leveransen i kundportalen.`,
              entityType: "ORDER",
              entityId: orderId,
            })),
          });
        }
        return { id: `mail-ship-${orderId}` };
      },
      async sendRepeatReminder(orderId) {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            customer: { include: { users: { where: { role: "CUSTOMER", isActive: true } } } },
            items: { include: { variant: { include: { product: true } } } },
          },
        });
        const item = order?.items[0];
        const qty = item?.qty ?? 0;
        const product = item?.variant.product.name ?? "profilvatten";
        if (order?.customer.users.length) {
          await prisma.notification.createMany({
            data: order.customer.users.map((u) => ({
              userId: u.id,
              type: "email",
              title: "Snart dags igen?",
              body: `Förra gången beställde ni ${qty.toLocaleString("sv-SE")} flaskor ${product}. Starta från förra ordern med Beställ igen.`,
              entityType: "ORDER",
              entityId: orderId,
            })),
          });
        }
        return { id: `mail-repeat-${orderId}` };
      },
    },
    notifications: {
      async publish(input) {
        await prisma.notification.create({ data: input });
      },
      async listForUser(userId) {
        return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 40 });
      },
      async markRead(id) {
        await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
      },
    },
  };
}
