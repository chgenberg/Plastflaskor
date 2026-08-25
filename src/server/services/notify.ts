import { prisma } from "../db";
import { ORDER_STEP_LABELS, type OrderStatusCode } from "@/domain/enums";

export async function notifyOrderChange(orderId: string, toStatus: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { reseller: { include: { users: true } }, customer: true },
  });
  if (!order) return;
  const title = ORDER_STEP_LABELS[toStatus as OrderStatusCode] ?? toStatus;
  const body = `${order.orderNo} · ${order.customer.name}`;
  const staff = await prisma.user.findMany({
    where: { role: { in: ["AQUA_STAFF", "AQUA_ADMIN"] }, isActive: true },
    select: { id: true },
  });
  const ids = [...new Set([...staff.map((u) => u.id), ...order.reseller.users.map((u) => u.id)])];
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
