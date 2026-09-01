import { invoiceBuyerLabel } from "@/domain/enums";
import { DashTable, LinkButton, RowHit, StatusChip, TableActions } from "@/ui/shell/primitives";

export type InvoiceRow = {
  id: string;
  invoiceNo: string;
  orderNo: string;
  customer?: string;
  amountIncVat: number;
  status: string;
  dueAt?: Date | string | null;
  issuedAt?: Date | string | null;
  pdfId?: string | null;
};

function fmtDate(value?: Date | string | null) {
  if (!value) return "–";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("sv-SE");
}

export function InvoiceTable({ rows, showCustomer }: { rows: InvoiceRow[]; showCustomer?: boolean }) {
  return (
    <DashTable
      count={`${rows.length} faktura${rows.length === 1 ? "" : "r"}`}
      columns={[
        { label: "Faktura" },
        { label: "Order" },
        ...(showCustomer ? [{ label: "Kund" }] : []),
        { label: "Utfärdad" },
        { label: "Förfaller" },
        { label: "Belopp", align: "right" as const },
        { label: "Status" },
        { label: "PDF", sr: true },
      ]}
    >
      {rows.map((r) => {
        const label = invoiceBuyerLabel(r.status, r.dueAt);
        return (
          <tr key={r.id}>
            <td>
              <RowHit href={`/konto/fakturor?order=${r.orderNo}`}>{r.invoiceNo}</RowHit>
            </td>
            <td>{r.orderNo}</td>
            {showCustomer ? <td>{r.customer ?? "–"}</td> : null}
            <td className="whitespace-nowrap tabular-nums text-[var(--av-text-muted)]">{fmtDate(r.issuedAt)}</td>
            <td className="whitespace-nowrap tabular-nums text-[var(--av-text-muted)]">{fmtDate(r.dueAt)}</td>
            <td className="av-num font-semibold">{r.amountIncVat.toLocaleString("sv-SE")} kr</td>
            <td>
              <StatusChip
                status={r.status === "PAID" ? "PAID" : "INVOICED"}
                label={label}
                requestedDate={label === "Förfallen" ? "2000-01-01" : null}
              />
            </td>
            <td className="av-actions">
              {r.pdfId ? (
                <TableActions>
                  <LinkButton href={`/api/documents/${r.pdfId}`} variant="secondary" size="sm">
                    PDF
                  </LinkButton>
                </TableActions>
              ) : null}
            </td>
          </tr>
        );
      })}
    </DashTable>
  );
}
