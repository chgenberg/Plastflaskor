import { prisma } from "../db";
import { advanceOrder } from "./order.service";

export const FACTORY_EVENTS = [
  "LABELS_RECEIVED_BY_FACTORY",
  "PRODUCTION_STARTED",
  "BOTTLES_FILLED",
  "LABELS_APPLIED",
  "PRODUCTION_DONE",
  "WAYBILL_CREATED",
  "SHIPPED_TO_END_CUSTOMER",
] as const;

export async function listJobsForFactory(factoryId: string) {
  return prisma.productionJob.findMany({
    where: { factoryId },
    include: {
      order: {
        include: {
          items: { include: { variant: { include: { product: true } } } },
          shippingAddress: true,
          customer: true,
          label: true,
          shipments: true,
          documents: { where: { kind: { in: ["PRODUCTION", "LOGISTICS", "ARTWORK", "WAYBILL"] } } },
        },
      },
      factory: true,
    },
    orderBy: { plannedAt: "asc" },
  });
}

export async function getJob(jobId: string, factoryId?: string) {
  const job = await prisma.productionJob.findUnique({
    where: { id: jobId },
    include: {
      order: {
        include: {
          items: { include: { variant: { include: { product: true } } } },
          shippingAddress: true,
          customer: true,
          label: true,
          shipments: true,
          documents: { where: { kind: { in: ["PRODUCTION", "LOGISTICS", "ARTWORK", "WAYBILL"] } } },
        },
      },
      factory: true,
    },
  });
  if (!job) return null;
  if (factoryId && job.factoryId !== factoryId) return null;
  return job;
}

export async function factoryAdvance(jobId: string, factoryId: string, action: (typeof FACTORY_EVENTS)[number]) {
  const job = await prisma.productionJob.findFirst({ where: { id: jobId, factoryId } });
  if (!job) throw new Error("Jobb saknas");
  if (action === "LABELS_RECEIVED_BY_FACTORY") {
    await prisma.label.update({
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
  await advanceOrder(job.orderId, action, "FACTORY", "factory");
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
