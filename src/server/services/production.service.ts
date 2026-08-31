import { DocumentKind, Role } from "@prisma/client";
import { prisma } from "../db";
import { advanceOrder } from "./order.service";

const FACTORY_DOCS: DocumentKind[] = ["PRODUCTION", "LOGISTICS", "ARTWORK", "WAYBILL"];

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
    shipments: { select: { id: true, trackingNo: true, carrier: true, packages: true, weightKg: true, status: true, type: true } },
    documents: { where: { kind: { in: FACTORY_DOCS } }, select: { id: true, title: true, kind: true } },
    designs: {
      select: {
        id: true,
        projectName: true,
        files: { select: { id: true, fileName: true, storageKey: true } },
      },
    },
    artworkVersions: { where: { isFinal: true }, select: { id: true, title: true, storageKey: true, designId: true } },
  },
};

export const FACTORY_EVENTS = ["ACCEPT_DEADLINE", "FLAG_ISSUE", "START", "DONE", "SHIPPED"] as const;

export async function listJobsForFactory(factoryId?: string) {
  return prisma.productionJob.findMany({
    where: {
      ...(factoryId ? { factoryId } : {}),
      order: { currentStatus: { in: ["CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED"] } },
    },
    include: { order: factoryOrder, factory: true },
    orderBy: { plannedAt: "asc" },
  });
}

export async function getJob(jobId: string, factoryId?: string) {
  const job = await prisma.productionJob.findUnique({
    where: { id: jobId },
    include: { order: factoryOrder, factory: true },
  });
  if (!job) return null;
  if (factoryId && job.factoryId !== factoryId) return null;
  return job;
}

export async function factoryAdvance(
  jobId: string,
  factoryId: string,
  action: (typeof FACTORY_EVENTS)[number],
  actorRole: Role = "FACTORY",
  payload?: { issueNote?: string; readyDate?: string },
) {
  const job = await prisma.productionJob.findFirst({
    where: { id: jobId, factoryId },
    include: { order: true },
  });
  if (!job) throw new Error("Jobb saknas");

  if (action === "ACCEPT_DEADLINE") {
    await prisma.order.update({
      where: { id: job.orderId },
      data: { factoryDeadlineAccepted: true, factoryIssueNote: null },
    });
    await prisma.productionJob.update({ where: { id: jobId }, data: { status: "ACCEPTED" } });
    return;
  }
  if (action === "FLAG_ISSUE") {
    await prisma.order.update({
      where: { id: job.orderId },
      data: { factoryDeadlineAccepted: false, factoryIssueNote: payload?.issueNote || "Kan inte hålla deadline" },
    });
    await prisma.productionJob.update({ where: { id: jobId }, data: { status: "ISSUE_FLAGGED", operatorNote: payload?.issueNote } });
    return;
  }
  if (action === "START") {
    await prisma.productionJob.update({ where: { id: jobId }, data: { status: "STARTED", startedAt: new Date() } });
    if (job.order.currentStatus === "CONFIRMED") {
      await advanceOrder(job.orderId, "IN_PRODUCTION", actorRole, "factory");
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
    return;
  }
  if (action === "SHIPPED") {
    await prisma.shipment.updateMany({
      where: { orderId: job.orderId, type: "GOODS_TO_CUSTOMER" },
      data: { status: "PICKED_UP", shippedAt: new Date() },
    });
    if (job.order.currentStatus === "READY_TO_SHIP") {
      await advanceOrder(job.orderId, "SHIPPED", actorRole, "factory");
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
