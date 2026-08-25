import { DocumentKind, Role } from "@prisma/client";
import { prisma } from "../db";
import { advanceOrder } from "./order.service";

const FACTORY_DOCS: DocumentKind[] = ["PRODUCTION", "LOGISTICS", "ARTWORK", "WAYBILL"];

const factoryOrder = {
  select: {
    id: true,
    orderNo: true,
    requestedDate: true,
    factoryId: true,
    currentStatus: true,
    items: {
      select: {
        qty: true,
        variant: {
          select: {
            name: true,
            volumeMl: true,
            optionsJson: true,
            product: { select: { name: true, category: true } },
          },
        },
      },
    },
    shippingAddress: true,
    customer: { select: { name: true } },
    label: true,
    shipments: { select: { id: true, trackingNo: true, carrier: true, packages: true, weightKg: true, status: true, type: true } },
    documents: { where: { kind: { in: FACTORY_DOCS } }, select: { id: true, title: true, kind: true } },
    designs: { select: { id: true, projectName: true } },
  },
};

export const FACTORY_EVENTS = [
  "LABELS_RECEIVED_BY_FACTORY",
  "PRODUCTION_STARTED",
  "BOTTLES_FILLED",
  "LABELS_APPLIED",
  "PRODUCTION_DONE",
  "WAYBILL_CREATED",
  "SHIPPED_TO_END_CUSTOMER",
] as const;

export async function listJobsForFactory(factoryId?: string) {
  return prisma.productionJob.findMany({
    where: factoryId ? { factoryId } : undefined,
    include: {
      order: factoryOrder,
      factory: true,
    },
    orderBy: { plannedAt: "asc" },
  });
}

export async function getJob(jobId: string, factoryId?: string) {
  const job = await prisma.productionJob.findUnique({
    where: { id: jobId },
    include: {
      order: factoryOrder,
      factory: true,
    },
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
) {
  const job = await prisma.productionJob.findFirst({ where: { id: jobId, factoryId } });
  if (!job) throw new Error("Jobb saknas");
  if (action === "LABELS_RECEIVED_BY_FACTORY") {
    await prisma.label.updateMany({
      where: { orderId: job.orderId },
      data: { status: "RECEIVED_BY_FACTORY", receivedAt: new Date() },
    });
  }
  if (action === "PRODUCTION_STARTED") {
    await prisma.productionJob.update({
      where: { id: jobId },
      data: { status: "STARTED", startedAt: new Date() },
    });
  }
  if (action === "BOTTLES_FILLED") {
    await prisma.productionJob.update({ where: { id: jobId }, data: { status: "FILLED", filledAt: new Date() } });
  }
  if (action === "LABELS_APPLIED") {
    await prisma.productionJob.update({ where: { id: jobId }, data: { status: "LABELS_APPLIED", labeledAt: new Date() } });
  }
  if (action === "PRODUCTION_DONE") {
    await prisma.productionJob.update({
      where: { id: jobId },
      data: { status: "DONE", completedAt: new Date() },
    });
  }
  if (action === "SHIPPED_TO_END_CUSTOMER") {
    await prisma.shipment.updateMany({
      where: { orderId: job.orderId, type: "GOODS_TO_CUSTOMER" },
      data: { status: "PICKED_UP", shippedAt: new Date() },
    });
  }
  await advanceOrder(job.orderId, action, actorRole, "factory");
}

export async function weekProduction(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const jobs = await prisma.productionJob.findMany({
    where: { plannedAt: { gte: weekStart, lt: weekEnd } },
    include: { order: { include: { items: { include: { variant: { include: { product: true } } } } } } },
  });
  return jobs;
}
