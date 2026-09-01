import { notFound } from "next/navigation";
import { getOrderByNo } from "@/server/services/order.service";
import { getPriceListForBuyer, resolveUnitPrice } from "@/server/services/catalog.service";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { RepeatOrderForm } from "@/ui/order/RepeatOrderForm";
import { DashPage, PageHeader, Panel } from "@/ui/shell/primitives";

const REPEAT_QTYS = [270, 500, 1000, 2500, 5000];

export default async function OpsRepeat({
  params,
  searchParams,
}: {
  params: Promise<{ orderNo: string }>;
  searchParams: Promise<{ lead?: string }>;
}) {
  const { orderNo } = await params;
  const { lead } = await searchParams;
  const order = await getOrderByNo(orderNo);
  if (!order?.lockedAt) notFound();
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
    <DashPage>
      <PageHeader title="Skapa repeat" subtitle={`${order.orderNo} · ${order.customer.name}`} />
      <Panel>
        <RepeatOrderForm
          sourceOrderId={order.id}
          spec={spec}
          defaultQty={item?.qty ?? moq}
          moq={moq}
          prices={prices}
          leadId={lead}
        />
      </Panel>
    </DashPage>
  );
}
