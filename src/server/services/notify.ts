import { prisma } from "../db";
import { ORDER_STEP_LABELS, type OrderStatusCode } from "@/domain/enums";

const CUSTOMER_STATUSES = new Set([
  "ARTWORK_CUSTOMER_APPROVAL",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "INVOICED",
]);

export async function notifyOrderChange(orderId: string, toStatus: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true },
  });
  if (!order) return;
  const title =
    toStatus === "CONFIRMED" ? "Slutlig orderbekräftelse" : (ORDER_STEP_LABELS[toStatus as OrderStatusCode] ?? toStatus);
  const body =
    toStatus === "CONFIRMED"
      ? `${order.orderNo} är godkänd och låst. Öppna orderbekräftelsen i kundportalen.`
      : `${order.orderNo} · ${order.customer.name}`;
  const staff = await prisma.user.findMany({
    where: { role: { in: ["AQUA_STAFF", "AQUA_ADMIN"] }, isActive: true },
    select: { id: true },
  });
  const customerUsers = CUSTOMER_STATUSES.has(toStatus)
    ? await prisma.user.findMany({ where: { customerId: order.customerId }, select: { id: true } })
    : [];
  const ids = [...new Set([...staff.map((u) => u.id), ...customerUsers.map((u) => u.id)])];
  if (!ids.length) return;
  await prisma.notification.createMany({
    data: ids.map((userId) => ({
      userId,
      type: toStatus,
      title,
      body,
      entityType: "ORDER",
      entityId: orderId,
    })),
  });
}

export async function unreadCountFor(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function notifyQuoteInquiry(input: {
  company: string;
  email: string;
  phone?: string;
  city?: string;
  message?: string;
  productName: string;
  qty: number;
}) {
  const staff = await prisma.user.findMany({
    where: { role: { in: ["AQUA_STAFF", "AQUA_ADMIN"] }, isActive: true },
    select: { id: true },
  });
  if (!staff.length) return;
  const parts = [
    input.company,
    input.email,
    input.productName,
    `${input.qty.toLocaleString("sv-SE")} st`,
    input.city,
    input.phone,
    input.message,
  ].filter(Boolean);
  await prisma.notification.createMany({
    data: staff.map((u) => ({
      userId: u.id,
      type: "quote",
      title: "Offertförfrågan",
      body: parts.join(" · "),
      entityType: "QUOTE",
      entityId: input.email,
    })),
  });
}

export async function listUnreadQuoteInquiries() {
  const rows = await prisma.notification.findMany({
    where: { type: "quote", readAt: null },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  const seen = new Set<string>();
  return rows.filter((n) => {
    const key = n.body;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
