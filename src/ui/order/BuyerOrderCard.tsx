import Link from "next/link";
import type { VisualSpec } from "@/domain/visualSpec";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { LinkButton, StatusChip } from "@/ui/shell/primitives";

export function BuyerOrderCard({
  href,
  orderNo,
  spec,
  status,
  statusLabel,
  delivery,
  customer,
  actionHref,
  actionLabel,
}: {
  href: string;
  orderNo: string;
  spec: VisualSpec | null;
  status: string;
  statusLabel: string;
  delivery?: string | null;
  customer?: string | null;
  actionHref?: string | null;
  actionLabel?: string | null;
}) {
  return (
    <article className="av-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={href} className="av-mono text-[13px] font-medium text-[var(--av-accent)]">
            {orderNo}
          </Link>
          {customer ? <p className="mt-0.5 text-[13px] text-[var(--av-text-muted)]">{customer}</p> : null}
        </div>
        <StatusChip status={status} label={statusLabel} />
      </div>
      {spec ? (
        <div className="mt-4">
          <VisualSpecCard spec={spec} compact />
        </div>
      ) : null}
      <p className="mt-4 text-[14px] font-medium text-[var(--av-text)]">{delivery ?? "Leverans bekräftas av AquaVisibility"}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <LinkButton href={href} variant="secondary">
          Öppna order
        </LinkButton>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="text-[13px] font-medium text-[var(--av-accent)]">
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
