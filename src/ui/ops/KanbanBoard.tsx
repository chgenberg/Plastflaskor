import Image from "next/image";
import Link from "next/link";
import { PIPELINE_PHASES, ORDER_STEP_LABELS, type OrderStatusCode } from "@/domain/enums";
import { isOverdue } from "@/domain/orderBrief";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { StatusChip } from "@/ui/shell/primitives";

type KanbanOrder = {
  id: string;
  orderNo: string;
  currentStatus: string;
  requestedDate: string | null;
  factoryIssueNote: string | null;
  factoryDeadlineAccepted: boolean;
  visualSpecJson: string | null;
  customer: { name: string };
  items: {
    qty: number;
    visualSpecJson: string | null;
    variant: { volumeMl: number | null; optionsJson: string; product: { name: string; slug: string } };
  }[];
};

function specFor(order: KanbanOrder) {
  const item = order.items[0];
  return specFromOrderItem({
    visualSpecJson: order.visualSpecJson,
    item,
    imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
  });
}

export function KanbanBoard({ orders }: { orders: KanbanOrder[] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 md:-mx-8 md:px-8">
      <div className="flex min-w-max gap-3 pb-4">
        {PIPELINE_PHASES.map((phase) => {
          const cards = orders.filter((o) => (phase.statuses as readonly string[]).includes(o.currentStatus));
          return (
            <section key={phase.id} className="av-card flex w-[260px] shrink-0 flex-col">
              <header className="flex items-center justify-between gap-2 border-b border-[var(--av-border)] px-4 py-3">
                <h2 className="text-[13px] font-medium text-[var(--av-text)]">{phase.label}</h2>
                <span className="rounded-md bg-[var(--av-accent-soft)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--av-accent)]">
                  {cards.length}
                </span>
              </header>
              <div className="flex flex-col gap-2 p-2">
                {cards.length === 0 ? <p className="px-2 py-6 text-center text-[12px] text-[var(--av-text-muted)]">Inga ordrar</p> : null}
                {cards.map((o) => {
                  const item = o.items[0];
                  const late = isOverdue(o.currentStatus, o.requestedDate);
                  const flagged = Boolean(o.factoryIssueNote) && !o.factoryDeadlineAccepted;
                  const spec = specFor(o);
                  const buyer = o.customer.name;
                  return (
                    <Link
                      key={o.id}
                      href={`/operations/ordrar/${o.orderNo}`}
                      className="rounded-[var(--av-radius-md)] border border-[var(--av-border)] bg-[var(--av-bg)] p-3 hover:border-[var(--av-accent)]/30 hover:bg-[var(--av-accent-soft)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="av-mono text-[13px] font-medium text-[var(--av-accent)]">{o.orderNo}</p>
                        {late || flagged ? (
                          <span className="rounded-full bg-[var(--av-status-blocked-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--av-status-blocked-fg)]">
                            {late ? "Försenad" : "Flagga"}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-start gap-2">
                        {spec?.imageSrc ? (
                          <span className="relative h-10 w-8 shrink-0 overflow-hidden rounded-lg bg-[var(--av-surface)]">
                            <Image src={spec.imageSrc} alt="" fill className="object-contain p-0.5" sizes="32px" />
                          </span>
                        ) : null}
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium">{buyer}</p>
                          <p className="mt-0.5 text-[12px] text-[var(--av-text-muted)]">
                            {item?.variant.product.name ?? "–"} · {item?.qty.toLocaleString("sv-SE") ?? "–"} st
                          </p>
                        </div>
                      </div>
                      <p className="mt-1 text-[12px] font-medium text-[var(--av-text)]">Leverans {o.requestedDate ?? "saknas"}</p>
                      {spec ? <div className="mt-1"><VisualSpecCard spec={spec} dense /></div> : null}
                      <div className="mt-2">
                        <StatusChip status={o.currentStatus} label={ORDER_STEP_LABELS[o.currentStatus as OrderStatusCode]} requestedDate={o.requestedDate} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
