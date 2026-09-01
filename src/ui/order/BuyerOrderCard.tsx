import Link from "next/link";
import type { VisualSpec } from "@/domain/visualSpec";
import { DashTable, LinkButton, StatusChip, TableActions } from "@/ui/shell/primitives";

export type BuyerOrderRow = {
  href: string;
  orderNo: string;
  spec: VisualSpec | null;
  status: string;
  statusLabel: string;
  delivery?: string | null;
  customer?: string | null;
  actionHref?: string | null;
  actionLabel?: string | null;
};

export function BuyerOrderTable({ rows }: { rows: BuyerOrderRow[] }) {
  const showCustomer = rows.some((r) => r.customer);
  return (
    <DashTable
      count={`${rows.length} order${rows.length === 1 ? "" : "ar"}`}
      columns={[
        { label: "Order" },
        ...(showCustomer ? [{ label: "Kund" }] : []),
        { label: "Innehåll" },
        { label: "Leverans" },
        { label: "Status" },
        { label: "Åtgärd", sr: true },
      ]}
    >
      {rows.map((r) => {
        const product = r.spec ? `${r.spec.productName} · ${r.spec.qty.toLocaleString("sv-SE")} st` : "–";
        return (
          <tr key={r.orderNo}>
            <td>
              <Link href={r.href} className="font-semibold text-[var(--av-text)] hover:text-[var(--av-accent)]">
                {r.orderNo}
              </Link>
            </td>
            {showCustomer ? <td>{r.customer ?? "–"}</td> : null}
            <td>{product}</td>
            <td className="text-[var(--av-text-secondary)]">{r.delivery ?? "Leverans bekräftas"}</td>
            <td>
              <StatusChip status={r.status} label={r.statusLabel} />
            </td>
            <td className="av-actions">
              <TableActions>
                <LinkButton href={r.href} variant="secondary" size="sm">
                  Öppna
                </LinkButton>
                {r.actionHref && r.actionLabel ? (
                  <LinkButton href={r.actionHref} size="sm">
                    {r.actionLabel}
                  </LinkButton>
                ) : null}
              </TableActions>
            </td>
          </tr>
        );
      })}
    </DashTable>
  );
}
