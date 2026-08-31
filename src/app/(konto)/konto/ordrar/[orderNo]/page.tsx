import { notFound } from "next/navigation";
import { requireRole } from "@/server/rbac";
import { getOrderByNo } from "@/server/services/order.service";
import { BuyerOrderDetail } from "@/ui/order/BuyerOrderDetail";

export default async function KontoOrder({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const order = await getOrderByNo(orderNo);
  if (!order) notFound();
  if (user.role === "CUSTOMER" && order.customerId !== user.customerId) notFound();
  return (
    <BuyerOrderDetail
      order={{ ...order, artworkApprovals: order.artworkApprovals }}
      role={user.role}
      repeatHref={`/konto/ordrar/${order.orderNo}/repeat`}
    />
  );
}
