import { ORDER_STEP_LABELS, type OrderStatusCode } from "@/domain/enums";
import { listAllOrders } from "@/server/services/order.service";
import { DashList, DashRow, EmptyState, LinkButton, PageHeader, StatusChip } from "@/ui/shell/primitives";

export default async function ShippingPage() {
  const orders = await listAllOrders({ phaseStatuses: ["READY_TO_SHIP", "SHIPPED"] });
  return (
    <div className="space-y-7">
      <PageHeader title="Frakt" subtitle="Fraktsedel, spårning och leverans." />
      {orders.length === 0 ? (
        <EmptyState title="Inget att skicka" body="När produktion är klar syns ordrarna här." />
      ) : (
        <DashList>
          {orders.map((o) => {
            const item = o.items[0];
            const goods = o.shipments.find((s) => s.type === "GOODS_TO_CUSTOMER");
            const cta =
              o.currentStatus === "READY_TO_SHIP" && !goods
                ? { href: `/operations/ordrar/${o.orderNo}`, label: "Skapa fraktsedel" }
                : o.currentStatus === "SHIPPED"
                  ? { href: `/operations/ordrar/${o.orderNo}`, label: "Markera levererad" }
                  : { href: `/operations/ordrar/${o.orderNo}`, label: "Öppna" };
            return (
              <DashRow
                key={o.id}
                primary={o.orderNo}
                primaryHref={`/operations/ordrar/${o.orderNo}`}
                columns={[
                  o.customer.name,
                  item ? `${item.variant.product.name} · ${item.qty.toLocaleString("sv-SE")} st` : "–",
                  goods?.trackingNo ? `Spårning ${goods.trackingNo}` : "Spårning saknas",
                ]}
                status={
                  <StatusChip
                    status={o.currentStatus}
                    label={ORDER_STEP_LABELS[o.currentStatus as OrderStatusCode]}
                    requestedDate={o.requestedDate}
                  />
                }
                actions={
                  <LinkButton href={cta.href} variant={cta.label === "Öppna" ? "secondary" : "primary"} size="sm">
                    {cta.label}
                  </LinkButton>
                }
              />
            );
          })}
        </DashList>
      )}
    </div>
  );
}
