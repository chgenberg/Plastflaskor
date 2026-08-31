import { notFound } from "next/navigation";
import { requireRole } from "@/server/rbac";
import { getOrderByNo } from "@/server/services/order.service";
import { getPriceListForBuyer, resolveUnitPrice } from "@/server/services/catalog.service";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { RepeatOrderForm } from "@/ui/order/RepeatOrderForm";
import { PageHeader, Panel } from "@/ui/shell/primitives";

const REPEAT_QTYS = [270, 500, 1000, 2500, 5000];

export default async function KontoRepeat({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const order = await getOrderByNo(orderNo);
  if (!order || (user.role === "CUSTOMER" && order.customerId !== user.customerId)) notFound();
  if (!order.lockedAt) notFound();
  const item = order.items[0];
  const spec = specFromOrderItem({
    visualSpecJson: order.visualSpecJson,
    item,
    imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
  });
  const moq = item?.variant.product.moq ?? 270;
  const list = await getPriceListForBuyer({ customerId: order.customerId, variantId: item?.variantId });
  const prices = Object.fromEntries(
    REPEAT_QTYS.filter((q) => q >= moq).map((q) => [
      q,
      item ? (resolveUnitPrice(list?.items ?? [], item.variantId, q)?.unitPriceExVat ?? null) : null,
    ]),
  ) as Record<number, number | null>;
  return (
    <div className="space-y-8">
      <PageHeader title="Beställ igen" subtitle={`${order.orderNo} · samma artwork och spec`} />
      <Panel>
        <RepeatOrderForm
          sourceOrderId={order.id}
          spec={spec}
          defaultQty={item?.qty ?? moq}
          moq={moq}
          prices={prices}
        />
      </Panel>
    </div>
  );
}
