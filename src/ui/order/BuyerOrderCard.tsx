import Link from "next/link";
import type { VisualSpec } from "@/domain/visualSpec";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { StatusChip } from "@/ui/shell/primitives";

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
    <article className="rounded-[22px] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={href} className="font-mono text-sm font-medium text-[#3B5BAA]">
            {orderNo}
          </Link>
          {customer ? <p className="mt-0.5 text-sm text-[#6b7280]">{customer}</p> : null}
        </div>
        <StatusChip status={status} label={statusLabel} />
      </div>
      {spec ? (
        <div className="mt-4">
          <VisualSpecCard spec={spec} compact />
        </div>
      ) : null}
      <p className="mt-4 text-sm text-[#6b7280]">{delivery ?? "Leverans bekräftas av AquaVisibility"}</p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Link href={href} className="text-sm font-medium text-[#3B5BAA]">
          Öppna order
        </Link>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="text-sm font-medium text-[#3B5BAA]">
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
