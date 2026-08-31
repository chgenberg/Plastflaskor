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
          include: { items: true, reseller: true },
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
          labelPdfUrl: `/factory/jobb/${input.jobId ?? "na"}/fraktsedel?tracking=${trackingNo}`,
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
          include: { customer: { include: { users: true } }, reseller: { include: { users: true } } },
        });
        const recipients = [
          ...(order?.customer.users ?? []),
          ...(order?.reseller?.users ?? []),
        ];
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
        return { id: `mail-art-${orderId}` };
      },
      async sendDeliveryNotice(orderId) {
        return { id: `mail-ship-${orderId}` };
      },
      async sendRepeatReminder(orderId) {
        return { id: `mail-repeat-${orderId}` };
      },
    },
    designAI: {
      async extractBrand(websiteUrl) {
        await delay(1400);
        const hash = websiteUrl.length;
        const palettes = [
          ["#005CAF", "#171717", "#F9F9F9", "#16A34A"],
          ["#111111", "#E11D48", "#FFFFFF", "#F59E0B"],
          ["#0F172A", "#38BDF8", "#F8FAFC", "#22C55E"],
        ];
        return {
          logoUrl: "/brand/aqua-visibility-logo.png",
          colors: palettes[hash % 3],
          styleNotes: "Simulerat: hämtad grafisk profil från angiven webbplats.",
        };
      },
      async generateProposals(websiteUrl, productName) {
        await delay(900);
        const extract = await this.extractBrand(websiteUrl);
        return [
          { id: "minimal", tone: "minimal" as const, title: "Avskalad", notes: `Ren vit etikett för ${productName}.`, canvas: { background: "#FFFFFF", logoScale: 0.7, qr: false } },
          { id: "bold", tone: "bold" as const, title: "Kraftfull", notes: `Mörk bakgrund, stor logotyp.`, canvas: { background: extract.colors[0], logoScale: 1.15, qr: false } },
          { id: "event", tone: "event" as const, title: "Evenemang", notes: `Accent + QR för evenemang.`, canvas: { background: extract.colors[1], logoScale: 0.9, qr: true } },
        ];
      },
      async refineProposal(message, current) {
        await delay(600);
        const next = { ...current, canvas: { ...current.canvas } };
        const m = message.toLowerCase();
        if (m.includes("större") || m.includes("stor")) next.canvas.logoScale = Math.min(1.4, next.canvas.logoScale + 0.2);
        if (m.includes("svart")) next.canvas.background = "#111111";
        if (m.includes("qr")) next.canvas.qr = true;
        next.notes = `Simulerat: "${message}"`;
        return next;
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
