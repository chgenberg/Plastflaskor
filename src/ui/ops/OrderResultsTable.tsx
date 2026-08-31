import Link from "next/link";
import { ORDER_STEP_LABELS, type OrderStatusCode } from "@/domain/enums";
import { isOverdue } from "@/domain/orderBrief";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { StatusChip } from "@/ui/shell/primitives";

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

const CARD = "rounded-[22px] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.04)]";

export function OrderResultsTable({ orders, hrefBase = "/operations/ordrar" }: { orders: ResultOrder[]; hrefBase?: string }) {
  return (
    <div className="space-y-4">
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
          <article key={o.id} className={CARD}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={href} className="font-mono text-sm font-medium text-[#3B5BAA]">
                  {o.orderNo}
                </Link>
                <p className="mt-0.5 text-sm">{o.customer.name}</p>
                <p className="mt-0.5 text-sm text-[#6b7280]">{o.reseller?.company.name ?? "Direktkund"}</p>
              </div>
              <StatusChip status={o.currentStatus} label={ORDER_STEP_LABELS[o.currentStatus as OrderStatusCode]} requestedDate={o.requestedDate} />
            </div>
            <p className="mt-4 font-medium">
              {spec?.productName ?? item?.variant.product.name ?? "–"}
              {item ? ` · ${item.qty.toLocaleString("sv-SE")} st` : ""}
            </p>
            {spec ? (
              <div className="mt-1">
                <VisualSpecCard spec={spec} dense />
              </div>
            ) : null}
            <p className="mt-4 text-sm">
              <span className={late ? "font-medium text-[var(--av-status-blocked-fg)]" : "text-[#6b7280]"}>{o.requestedDate ?? "–"}</span>
              {o.deliveryRequirement ? (
                <span
                  className="ml-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--av-status-blocked-fg)]"
                  title={o.deliveryRequirement}
                >
                  Leveranskrav
                </span>
              ) : null}
              {flagged ? <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--av-status-blocked-fg)]">Flagga</span> : null}
            </p>
          </article>
        );
      })}
    </div>
  );
}
