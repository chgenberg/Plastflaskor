import Link from "next/link";
import { PIPELINE_PHASES, ORDER_STEP_LABELS, type OrderStatusCode } from "@/domain/enums";
import { isOverdue } from "@/domain/orderBrief";
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

export function KanbanBoard({ orders }: { orders: KanbanOrder[] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 md:-mx-8 md:px-8">
      <div className="flex min-w-max gap-3 pb-4">
        {PIPELINE_PHASES.map((phase) => {
          const cards = orders.filter((o) => (phase.statuses as readonly string[]).includes(o.currentStatus));
          return (
            <section key={phase.id} className="av-card flex w-[240px] shrink-0 flex-col">
              <header className="flex items-center justify-between gap-2 border-b border-[var(--av-border)] px-3 py-2">
                <h2 className="text-[13px] font-medium text-[var(--av-text)]">{phase.label}</h2>
                <span className="rounded-md bg-[var(--av-accent-soft)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--av-accent)]">
                  {cards.length}
                </span>
              </header>
              <div className="flex max-h-[calc(100dvh-14rem)] flex-col gap-1 overflow-y-auto p-1.5">
                {cards.length === 0 ? <p className="px-2 py-4 text-center text-[12px] text-[var(--av-text-muted)]">Inga ordrar</p> : null}
                {cards.map((o) => {
                  const item = o.items[0];
                  const late = isOverdue(o.currentStatus, o.requestedDate);
                  const flagged = Boolean(o.factoryIssueNote) && !o.factoryDeadlineAccepted;
                  return (
                    <Link
                      key={o.id}
                      href={`/operations/ordrar/${o.orderNo}`}
                      className="rounded-[var(--av-radius-md)] border border-[var(--av-border)] bg-[var(--av-surface)] px-2.5 py-1.5 hover:border-[var(--av-accent)]/30"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-semibold tracking-tight">{o.orderNo}</p>
                        {late || flagged ? (
                          <span className="text-[11px] font-medium text-[var(--av-status-blocked-fg)]">
                            {late ? "Försenad" : "Flagga"}
                          </span>
                        ) : (
                          <StatusChip status={o.currentStatus} label={ORDER_STEP_LABELS[o.currentStatus as OrderStatusCode]} requestedDate={o.requestedDate} />
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-[var(--av-text-secondary)]">
                        {o.customer.name} · {item?.variant.product.name ?? "–"} · {item?.qty.toLocaleString("sv-SE") ?? "–"} st
                      </p>
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
