import { ORDER_STEP_LABELS, type OrderStatusCode } from "@/domain/enums";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { listAllOrders } from "@/server/services/order.service";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { EmptyState, LinkButton, PageHeader, StatusChip } from "@/ui/shell/primitives";

export default async function ShippingPage() {
  const orders = await listAllOrders({ phaseStatuses: ["READY_TO_SHIP", "SHIPPED"] });
  return (
    <div className="space-y-7">
      <PageHeader title="Frakt" subtitle="Fraktsedel, spårning och leverans." />
      {orders.length === 0 ? (
        <EmptyState title="Inget att skicka" body="När produktion är klar syns ordrarna här." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {orders.map((o) => {
            const item = o.items[0];
            const spec = specFromOrderItem({
              visualSpecJson: o.visualSpecJson,
              item,
              imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
            });
            const cta =
              o.currentStatus === "READY_TO_SHIP" && !o.shipments[0]
                ? { href: `/operations/ordrar/${o.orderNo}`, label: "Skapa fraktsedel" }
                : o.currentStatus === "SHIPPED"
                  ? { href: `/operations/ordrar/${o.orderNo}`, label: "Markera levererad" }
                  : { href: `/operations/ordrar/${o.orderNo}`, label: "Öppna" };
            return (
              <article key={o.id} className="av-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="av-mono text-[13px] font-medium text-[var(--av-accent)]">{o.orderNo}</p>
                    <p className="mt-0.5 text-[14px] font-medium">{o.customer.name}</p>
                  </div>
                  <StatusChip
                    status={o.currentStatus}
                    label={ORDER_STEP_LABELS[o.currentStatus as OrderStatusCode]}
                    requestedDate={o.requestedDate}
                  />
                </div>
                {spec ? (
                  <div className="mt-4">
                    <VisualSpecCard spec={spec} compact />
                  </div>
                ) : null}
                <p className="mt-4 text-[13px] text-[var(--av-text-muted)]">
                  Spårning {o.shipments[0]?.trackingNo ?? "saknas"}
                </p>
                {o.currentStatus === "READY_TO_SHIP" && o.shipments[0] ? (
                  <p className="mt-1 text-[13px] text-[var(--av-text-muted)]">Fraktsedel klar · tryckeriet markerar skickad</p>
                ) : null}
                <div className="mt-4">
                  <LinkButton href={cta.href}>{cta.label}</LinkButton>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
