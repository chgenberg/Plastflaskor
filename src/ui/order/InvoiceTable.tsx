import { invoiceBuyerLabel } from "@/domain/enums";
import { DashList, DashRow, LinkButton, StatusChip } from "@/ui/shell/primitives";

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
    <DashList>
      {rows.map((r) => {
        const label = invoiceBuyerLabel(r.status, r.dueAt);
        return (
          <DashRow
            key={r.id}
            primary={r.invoiceNo}
            columns={[
              r.orderNo,
              showCustomer ? r.customer : null,
              `Utfärdad ${fmtDate(r.issuedAt)}`,
              `Förfaller ${fmtDate(r.dueAt)}`,
              `${r.amountIncVat.toLocaleString("sv-SE")} kr`,
            ].filter(Boolean)}
            status={
              <StatusChip
                status={r.status === "PAID" ? "PAID" : "INVOICED"}
                label={label}
                requestedDate={label === "Förfallen" ? "2000-01-01" : null}
              />
            }
            actions={
              r.pdfId ? (
                <LinkButton href={`/api/documents/${r.pdfId}`} variant="secondary" size="sm">
                  PDF
                </LinkButton>
              ) : null
            }
          />
        );
      })}
    </DashList>
  );
}
