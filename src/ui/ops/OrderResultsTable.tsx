import Link from "next/link";
import { ORDER_STEP_LABELS, type OrderStatusCode } from "@/domain/enums";
import { isOverdue } from "@/domain/orderBrief";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { LinkButton, StatusChip } from "@/ui/shell/primitives";

type ResultOrder = {
  id: string;
  orderNo: string;
  currentStatus: string;
  requestedDate: string | null;
  factoryIssueNote: string | null;
  factoryDeadlineAccepted: boolean;
  deliveryRequirement?: string | null;
  visualSpecJson?: string | null;
  customer: { name: string };
  reseller: { company: { name: string } } | null;
  items: {
    qty: number;
    visualSpecJson?: string | null;
    variant: { volumeMl: number | null; optionsJson: string; product: { name: string; slug: string } };
  }[];
};

export function OrderResultsTable({ orders, hrefBase = "/operations/ordrar" }: { orders: ResultOrder[]; hrefBase?: string }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {orders.map((o) => {
        const href = `${hrefBase}/${o.orderNo}`;
        const item = o.items[0];
        const late = isOverdue(o.currentStatus, o.requestedDate);
        const flagged = Boolean(o.factoryIssueNote) && !o.factoryDeadlineAccepted;
        const spec = specFromOrderItem({
          visualSpecJson: o.visualSpecJson,
          item,
          imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
        });
        return (
          <article key={o.id} className="av-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={href} className="av-mono text-[13px] font-medium text-[var(--av-accent)]">
                  {o.orderNo}
                </Link>
                <p className="mt-0.5 text-[14px] font-medium">{o.customer.name}</p>
                <p className="mt-0.5 text-[13px] text-[var(--av-text-muted)]">{o.reseller?.company.name ?? "Direktkund"}</p>
              </div>
              <StatusChip status={o.currentStatus} label={ORDER_STEP_LABELS[o.currentStatus as OrderStatusCode]} requestedDate={o.requestedDate} />
            </div>
            {spec ? (
              <div className="mt-4">
                <VisualSpecCard spec={spec} compact />
              </div>
            ) : (
              <p className="mt-4 font-medium">
                {item?.variant.product.name ?? "–"}
                {item ? ` · ${item.qty.toLocaleString("sv-SE")} st` : ""}
              </p>
            )}
            <p className="mt-4 text-[14px]">
              <span className={late ? "font-medium text-[var(--av-status-blocked-fg)]" : "font-medium text-[var(--av-text)]"}>
                {o.requestedDate ? `Leverans ${o.requestedDate}` : "Inget leveransdatum"}
              </span>
              {o.deliveryRequirement ? (
                <span className="ml-2 text-[12px] font-medium text-[var(--av-status-blocked-fg)]">Leveranskrav</span>
              ) : null}
              {flagged ? <span className="ml-2 text-[12px] font-medium text-[var(--av-status-blocked-fg)]">Flagga</span> : null}
            </p>
            <div className="mt-4">
              <LinkButton href={href} variant="secondary">
                Öppna order
              </LinkButton>
            </div>
          </article>
        );
      })}
    </div>
  );
}
