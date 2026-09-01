import type { VisualSpec } from "@/domain/visualSpec";
import { DashTable, LinkButton, RowHit, StatusChip, TableActions } from "@/ui/shell/primitives";

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
  const showAction = rows.some((r) => r.actionHref && r.actionLabel);
  return (
    <DashTable
      count={`${rows.length} order${rows.length === 1 ? "" : "ar"}`}
      columns={[
        { label: "Order" },
        ...(showCustomer ? [{ label: "Kund" }] : []),
        { label: "Innehåll" },
        { label: "Leverans" },
        { label: "Status" },
        ...(showAction ? [{ label: "Åtgärd", sr: true }] : []),
      ]}
    >
      {rows.map((r) => {
        const product = r.spec ? `${r.spec.productName} · ${r.spec.qty.toLocaleString("sv-SE")} st` : "–";
        return (
          <tr key={r.orderNo}>
            <td>
              <RowHit href={r.href}>{r.orderNo}</RowHit>
            </td>
            {showCustomer ? <td>{r.customer ?? "–"}</td> : null}
            <td>{product}</td>
            <td className="text-[var(--av-text-secondary)]">{r.delivery ?? "Leverans bekräftas"}</td>
            <td>
              <StatusChip status={r.status} label={r.statusLabel} />
            </td>
            {showAction ? (
              <td className="av-actions">
                {r.actionHref && r.actionLabel ? (
                  <TableActions>
                    <LinkButton href={r.actionHref} size="sm">
                      {r.actionLabel}
                    </LinkButton>
                  </TableActions>
                ) : null}
              </td>
            ) : null}
          </tr>
        );
      })}
    </DashTable>
  );
}
