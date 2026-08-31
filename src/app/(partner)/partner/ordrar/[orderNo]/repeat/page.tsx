import { notFound } from "next/navigation";
import { getOrderByNo } from "@/server/services/order.service";
import { requireRole } from "@/server/rbac";
import { getPricesForReseller, resolveUnitPrice } from "@/server/services/catalog.service";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { RepeatOrderForm } from "@/ui/order/RepeatOrderForm";
import { PageHeader, Panel } from "@/ui/shell/primitives";

const BASE_QTYS = [500, 1000, 2500, 5000];

export default async function RepeatPage({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const order = await getOrderByNo(orderNo);
  if (!order || (user.role === "RESELLER" && order.resellerId !== user.resellerId)) notFound();
  if (!order.lockedAt) notFound();
  const item = order.items[0];
  if (!item) notFound();
  const moq = item.variant.product.moq;
  const qtyTiers = BASE_QTYS.filter((n) => n >= moq);
  const list = await getPricesForReseller(user.resellerId ?? order.resellerId ?? "", item.variantId);
  const prices = Object.fromEntries(
    qtyTiers.map((n) => [n, resolveUnitPrice(list?.items ?? [], item.variantId, n)?.unitPriceExVat ?? null]),
  ) as Record<number, number | null>;
  const spec = specFromOrderItem({
    visualSpecJson: order.visualSpecJson,
    item,
    imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
  });

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <PageHeader title="Beställ igen" subtitle={`${item.variant.product.name} · samma artwork och spec.`} />
      <Panel>
        <RepeatOrderForm sourceOrderId={order.id} spec={spec} defaultQty={item.qty} moq={moq} prices={prices} />
      </Panel>
    </div>
  );
}
