import { notFound } from "next/navigation";
import { getOrderByNo } from "@/server/services/order.service";
import { requireRole } from "@/server/rbac";
import { BuyerOrderDetail } from "@/ui/order/BuyerOrderDetail";

export default async function PartnerOrderDetail({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const order = await getOrderByNo(orderNo);
  if (!order || (user.role === "RESELLER" && order.resellerId !== user.resellerId)) notFound();
  return (
    <BuyerOrderDetail
      order={{ ...order, artworkApprovals: order.artworkApprovals }}
      role={user.role}
      repeatHref={`/partner/ordrar/${order.orderNo}/repeat`}
    />
  );
}
