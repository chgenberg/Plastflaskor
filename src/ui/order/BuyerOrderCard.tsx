import type { VisualSpec } from "@/domain/visualSpec";
import { DashRow, LinkButton, StatusChip } from "@/ui/shell/primitives";

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
  const product = spec ? `${spec.productName} · ${spec.qty.toLocaleString("sv-SE")} st` : null;
  return (
    <DashRow
      primary={orderNo}
      primaryHref={href}
      columns={[customer, product, delivery ?? "Leverans bekräftas"].filter(Boolean)}
      status={<StatusChip status={status} label={statusLabel} />}
      actions={
        <>
          <LinkButton href={href} variant="secondary" size="sm">
            Öppna
          </LinkButton>
          {actionHref && actionLabel ? (
            <LinkButton href={actionHref} size="sm">
              {actionLabel}
            </LinkButton>
          ) : null}
        </>
      }
    />
  );
}
