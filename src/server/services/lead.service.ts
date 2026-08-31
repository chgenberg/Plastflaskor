import { RepeatLeadStatus } from "@prisma/client";
import { prisma } from "../db";
import { getIntegrations } from "../integrations/composition";

export function leadWindow(horizonMonths: number, from = new Date()) {
  const expected = new Date(from);
  expected.setMonth(expected.getMonth() + horizonMonths);
  const activate = new Date(expected);
  activate.setMonth(activate.getMonth() - 1);
  return { expectedAt: expected, activateAt: activate };
}

export async function createLeadForOrder(orderId: string, horizonMonths: number) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order saknas");
  const { expectedAt, activateAt } = leadWindow(horizonMonths);
  const now = new Date();
  return prisma.repeatOpportunity.create({
    data: {
      sourceOrderId: order.id,
      customerId: order.customerId,
      expectedAt,
      activateAt,
      status: activateAt <= now ? "ACTIVE" : "UPCOMING",
    },
  });
}

export type LeadBucket = "week" | "month" | "reminded" | "converted" | "snoozed";

export function leadMatchesBucket(
  lead: { status: string; expectedAt: Date },
  bucket: LeadBucket,
  now = new Date(),
) {
  const week = new Date(now);
  week.setDate(week.getDate() + 7);
  const month = new Date(now);
  month.setDate(month.getDate() + 30);
  if (bucket === "week") return lead.status === "ACTIVE" && lead.expectedAt <= week;
  if (bucket === "month") return ["ACTIVE", "UPCOMING"].includes(lead.status) && lead.expectedAt <= month;
  if (bucket === "reminded") return lead.status === "CUSTOMER_REMINDED";
  if (bucket === "converted") return lead.status === "REPEAT_CREATED";
  return lead.status === "SNOOZED";
}

export async function listLeads() {
  const leads = await prisma.repeatOpportunity.findMany({
    include: {
      customer: true,
      sourceOrder: {
        include: {
          items: { include: { variant: { include: { product: true } } } },
          reseller: { include: { company: true } },
          documents: true,
        },
      },
    },
    orderBy: { expectedAt: "asc" },
  });
  const now = new Date();
  const week = new Date(now);
  week.setDate(week.getDate() + 7);
  const month = new Date(now);
  month.setDate(month.getDate() + 30);
  return {
    leads,
    buckets: {
      week: leads.filter((l) => l.status === "ACTIVE" && l.expectedAt <= week).length,
      month: leads.filter((l) => ["ACTIVE", "UPCOMING"].includes(l.status) && l.expectedAt <= month).length,
      reminded: leads.filter((l) => l.status === "CUSTOMER_REMINDED").length,
      converted: leads.filter((l) => l.status === "REPEAT_CREATED").length,
      snoozed: leads.filter((l) => l.status === "SNOOZED").length,
    },
  };
}

export async function activateDueLeads() {
  const due = await prisma.repeatOpportunity.findMany({
    where: { status: "UPCOMING", activateAt: { lte: new Date() } },
    include: { customer: true, sourceOrder: true },
  });
  for (const lead of due) {
    await prisma.repeatOpportunity.update({ where: { id: lead.id }, data: { status: "ACTIVE" } });
    const users = await prisma.user.findMany({
      where: {
        OR: [{ customerId: lead.customerId }, { role: { in: ["AQUA_STAFF", "AQUA_ADMIN"] } }],
      },
    });
    await getIntegrations().email.sendRepeatReminder(lead.sourceOrderId);
    for (const user of users) {
      await getIntegrations().notifications.publish({
        userId: user.id,
        type: "lead",
        title: "Snart dags för repeat",
        body: `${lead.customer.name} · ${lead.sourceOrder.orderNo}`,
        entityType: "ORDER",
        entityId: lead.sourceOrderId,
      });
    }
  }
  return due.length;
}

export async function updateLead(id: string, status: RepeatLeadStatus, note?: string) {
  return prisma.repeatOpportunity.update({
    where: { id },
    data: {
      status,
      note,
      snoozedUntil: status === "SNOOZED" ? new Date(Date.now() + 14 * 86400000) : null,
    },
  });
}

export async function remindLead(id: string) {
  const lead = await prisma.repeatOpportunity.findUnique({
    where: { id },
    select: { sourceOrderId: true },
  });
  if (!lead) throw new Error("Lead saknas");
  await getIntegrations().email.sendRepeatReminder(lead.sourceOrderId);
  return prisma.repeatOpportunity.update({
    where: { id },
    data: { status: "CUSTOMER_REMINDED" },
  });
}

export async function markLeadConverted(id: string, newOrderId: string) {
  return prisma.repeatOpportunity.update({
    where: { id },
    data: { status: "REPEAT_CREATED", convertedOrderId: newOrderId },
  });
}
