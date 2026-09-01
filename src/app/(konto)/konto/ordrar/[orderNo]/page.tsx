import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/server/rbac";
import { getOrderByNo } from "@/server/services/order.service";

export default async function KontoOrder({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const order = await getOrderByNo(orderNo);
  if (!order) notFound();
  if (user.role === "CUSTOMER" && order.customerId !== user.customerId) notFound();
  redirect(`/konto/ordrar?order=${encodeURIComponent(order.orderNo)}`);
}
