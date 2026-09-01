import { DocumentKind, Role } from "@prisma/client";
import { prisma } from "../db";
import { getIntegrations } from "../integrations/composition";
import { advanceOrder } from "./order.service";

const FACTORY_DOCS: DocumentKind[] = ["PRODUCTION", "LOGISTICS", "ARTWORK", "WAYBILL"];

const SUPPLIER_STATUSES = [
  "CONFIRMED",
  "LABEL_PRODUCTION",
  "LABELS_DISPATCHED",
  "LABELS_RECEIVED",
  "PRODUCTION_SCHEDULED",
  "IN_PRODUCTION",
  "READY_TO_SHIP",
  "SHIPPED",
] as const;

const factoryOrder = {
  select: {
    id: true,
    orderNo: true,
    requestedDate: true,
    confirmedDate: true,
    aquaApprovedDelivery: true,
    factoryId: true,
    currentStatus: true,
    visualSpecJson: true,
    factoryDeadline: true,
    factoryDeadlineAccepted: true,
    factoryIssueNote: true,
    factoryReadyEstimate: true,
    lockedAt: true,
    items: {
      select: {
        qty: true,
        visualSpecJson: true,
        variant: {
          select: {
            name: true,
            volumeMl: true,
            optionsJson: true,
            product: { select: { name: true, category: true, slug: true } },
          },
        },
      },
    },
    shippingAddress: true,
    customer: { select: { name: true } },
    factory: { select: { name: true, kind: true, address: { select: { line1: true, postalCode: true, city: true } } } },
    shipments: { select: { id: true, trackingNo: true, carrier: true, packages: true, weightKg: true, status: true, type: true } },
    documents: { where: { kind: { in: FACTORY_DOCS } }, select: { id: true, title: true, kind: true } },
    designs: {
      select: {
        id: true,
        projectName: true,
        files: { select: { id: true, fileName: true, storageKey: true, mimeType: true } },
      },
    },
    artworkVersions: { where: { isFinal: true }, select: { id: true, title: true, storageKey: true, designId: true } },
  },
};

export const FACTORY_EVENTS = [
  "ACCEPT_DEADLINE",
  "FLAG_ISSUE",
  "DISPATCH",
  "RECEIVE_LABELS",
  "ESTIMATE_DATE",
  "START",
  "DONE",
  "SHIPPED",
] as const;

export async function listJobsForFactory(factoryId?: string, factoryKind?: "label" | "bottler") {
  return prisma.productionJob.findMany({
    where: {
      ...(factoryId ? { factoryId } : {}),
      ...(factoryKind ? { factory: { kind: factoryKind } } : {}),
      order: { currentStatus: { in: [...SUPPLIER_STATUSES] } },
    },
    include: { order: factoryOrder, factory: true },
    orderBy: { plannedAt: "asc" },
  });
}

export async function getJob(jobId: string, factoryId?: string, factoryKind?: "label" | "bottler") {
  const job = await prisma.productionJob.findUnique({
    where: { id: jobId },
    include: { order: factoryOrder, factory: true },
  });
  if (!job) return null;
  if (factoryId && job.factoryId !== factoryId) return null;
  if (factoryKind && job.factory.kind !== factoryKind) return null;
  return job;
}

async function recordFactoryEvent(orderId: string, toStatus: string, actorRole: Role, source: string, payload?: string) {
  await prisma.statusEvent.create({
    data: {
      entityType: "ORDER",
      entityId: orderId,
      toStatus,
      actorRole,
      source,
      payload,
    },
  });
}

export async function factoryAdvance(
  jobId: string,
  factoryId: string,
  action: (typeof FACTORY_EVENTS)[number],
  actorRole: Role = "FACTORY",
  payload?: {
    issueNote?: string;
    readyDate?: string;
    trackingNo?: string;
    carrier?: string;
    shippedDate?: string;
    waybillNo?: string;
  },
) {
  const job = await prisma.productionJob.findFirst({
    where: { id: jobId, factoryId },
    include: { order: true, factory: true },
  });
  if (!job) throw new Error("Jobb saknas");
  const kind = job.factory.kind;
  const source = kind === "label" ? "labels" : "bottler";
  const labelActions = ["ACCEPT_DEADLINE", "FLAG_ISSUE", "DISPATCH"] as const;
  const bottlerActions = ["RECEIVE_LABELS", "ESTIMATE_DATE", "START", "DONE", "SHIPPED"] as const;
  if (kind === "label" && !(labelActions as readonly string[]).includes(action)) throw new Error("Forbidden");
  if (kind === "bottler" && !(bottlerActions as readonly string[]).includes(action)) throw new Error("Forbidden");

  if (action === "ACCEPT_DEADLINE") {
    await prisma.order.update({
      where: { id: job.orderId },
      data: { factoryDeadlineAccepted: true, factoryIssueNote: null },
    });
    await prisma.productionJob.update({ where: { id: jobId }, data: { status: "ACCEPTED" } });
    await recordFactoryEvent(job.orderId, "ACCEPT_DEADLINE", actorRole, source);
    if (job.order.currentStatus === "CONFIRMED") {
      await advanceOrder(job.orderId, "LABEL_PRODUCTION", actorRole, source);
    }
    return;
  }
  if (action === "FLAG_ISSUE") {
    await prisma.order.update({
      where: { id: job.orderId },
      data: { factoryDeadlineAccepted: false, factoryIssueNote: payload?.issueNote || "Kan inte hålla deadline" },
    });
    await prisma.productionJob.update({ where: { id: jobId }, data: { status: "ISSUE_FLAGGED", operatorNote: payload?.issueNote } });
    await recordFactoryEvent(job.orderId, "FLAG_ISSUE", actorRole, source, payload?.issueNote);
    return;
  }
  if (action === "DISPATCH") {
    const existing = await prisma.shipment.findFirst({
      where: { orderId: job.orderId, type: "LABELS_TO_FACTORY" },
    });
    const shippedAt = payload?.shippedDate ? new Date(payload.shippedDate) : new Date();
    const trackingNo = payload?.trackingNo || existing?.trackingNo || `LBL-${job.order.orderNo}`;
    const carrier = payload?.carrier || existing?.carrier || "PostNord";
    const waybillNo = payload?.waybillNo || existing?.waybillNo || undefined;
    if (!existing) {
      await prisma.shipment.create({
        data: {
          orderId: job.orderId,
          type: "LABELS_TO_FACTORY",
          carrier,
          trackingNo,
          waybillNo,
          status: "IN_TRANSIT",
          shippedAt,
        },
      });
    } else {
      await prisma.shipment.update({
        where: { id: existing.id },
        data: { trackingNo, carrier, waybillNo, status: "IN_TRANSIT", shippedAt },
      });
    }
    await prisma.productionJob.update({ where: { id: jobId }, data: { status: "DONE", completedAt: new Date() } });
    if (job.order.currentStatus === "CONFIRMED") {
      await advanceOrder(job.orderId, "LABEL_PRODUCTION", actorRole, source);
      await advanceOrder(job.orderId, "LABELS_DISPATCHED", actorRole, source);
    } else if (job.order.currentStatus === "LABEL_PRODUCTION") {
      await advanceOrder(job.orderId, "LABELS_DISPATCHED", actorRole, source);
    }
    return;
  }
  if (action === "RECEIVE_LABELS") {
    await prisma.shipment.updateMany({
      where: { orderId: job.orderId, type: "LABELS_TO_FACTORY" },
      data: { status: "DELIVERED" },
    });
    await prisma.productionJob.update({ where: { id: jobId }, data: { status: "ACCEPTED" } });
    if (job.order.currentStatus === "LABELS_DISPATCHED") {
      await advanceOrder(job.orderId, "LABELS_RECEIVED", actorRole, source);
    }
    return;
  }
  if (action === "ESTIMATE_DATE") {
    if (!payload?.readyDate) throw new Error("Ange estimerat datum");
    await prisma.order.update({
      where: { id: job.orderId },
      data: { factoryReadyEstimate: payload.readyDate },
    });
    await recordFactoryEvent(job.orderId, "READY_DATE", actorRole, source, payload.readyDate);
    return;
  }
  if (action === "START") {
    await prisma.productionJob.update({ where: { id: jobId }, data: { status: "STARTED", startedAt: new Date() } });
    await recordFactoryEvent(job.orderId, "START", actorRole, source);
    if (job.order.currentStatus === "CONFIRMED") {
      await advanceOrder(job.orderId, "LABEL_PRODUCTION", actorRole, source);
    } else if (job.order.currentStatus === "LABELS_RECEIVED") {
      await advanceOrder(job.orderId, "PRODUCTION_SCHEDULED", actorRole, source);
      await advanceOrder(job.orderId, "IN_PRODUCTION", actorRole, source);
    } else if (job.order.currentStatus === "PRODUCTION_SCHEDULED") {
      await advanceOrder(job.orderId, "IN_PRODUCTION", actorRole, source);
    }
    return;
  }
  if (action === "DONE") {
    await prisma.productionJob.update({
      where: { id: jobId },
      data: { status: "DONE", completedAt: new Date() },
    });
    if (payload?.readyDate) {
      await prisma.order.update({
        where: { id: job.orderId },
        data: { factoryReadyEstimate: payload.readyDate },
      });
    }
    await recordFactoryEvent(job.orderId, "DONE", actorRole, source, payload?.readyDate);
    return;
  }
  if (action === "SHIPPED") {
    if (job.order.currentStatus === "SHIPPED") return;
    const existing = await prisma.shipment.findFirst({
      where: { orderId: job.orderId, type: "GOODS_TO_CUSTOMER" },
    });
    const shippedAt = payload?.shippedDate ? new Date(payload.shippedDate) : new Date();
    if (!existing) {
      await prisma.shipment.create({
        data: {
          orderId: job.orderId,
          type: "GOODS_TO_CUSTOMER",
          carrier: payload?.carrier || "Bring (mock)",
          trackingNo: payload?.trackingNo || `MOCK-${job.order.orderNo}`,
          waybillNo: payload?.waybillNo || `WB-${job.order.orderNo}`,
          packages: 1,
          weightKg: 0,
          status: "PICKED_UP",
          shippedAt,
        },
      });
    } else {
      await prisma.shipment.update({
        where: { id: existing.id },
        data: { status: "PICKED_UP", shippedAt },
      });
    }
    let from: string = job.order.currentStatus;
    const next: Record<string, "IN_PRODUCTION" | "READY_TO_SHIP" | "SHIPPED"> = {
      PRODUCTION_SCHEDULED: "IN_PRODUCTION",
      IN_PRODUCTION: "READY_TO_SHIP",
      READY_TO_SHIP: "SHIPPED",
    };
    while (from !== "SHIPPED" && next[from]) {
      await advanceOrder(job.orderId, next[from], actorRole, source);
      from = next[from];
    }
    if (from === "SHIPPED") {
      await getIntegrations().email.sendDeliveryNotice(job.orderId);
    }
  }
}

export async function weekProduction(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return prisma.productionJob.findMany({
    where: { plannedAt: { gte: weekStart, lt: weekEnd } },
    include: { order: { include: { items: { include: { variant: { include: { product: true } } } } } } },
  });
}

export async function setFactoryDeadline(orderId: string, date: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: { factoryDeadline: date },
  });
}

export async function approveFactoryDate(orderId: string, date: string, role: Role) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { jobs: { select: { status: true } } },
  });
  if (!order) throw new Error("Order saknas");

  await prisma.order.update({
    where: { id: orderId },
    data: { aquaApprovedDelivery: date, confirmedDate: date },
  });
  await prisma.statusEvent.create({
    data: {
      entityType: "ORDER",
      entityId: orderId,
      toStatus: "DELIVERY_DATE_APPROVED",
      actorRole: role,
      source: "ops",
      payload: date,
    },
  });

  const jobDone = order.jobs.some((j) => j.status === "DONE");
  if (order.currentStatus === "IN_PRODUCTION" && jobDone) {
    await advanceOrder(orderId, "READY_TO_SHIP", role, "ops");
  }
}
