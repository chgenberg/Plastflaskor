import { invoiceBuyerLabel } from "@/domain/enums";
import { FileLink, StatusChip } from "@/ui/shell/primitives";

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

const CARD = "rounded-[22px] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.04)]";

function fmtDate(value?: Date | string | null) {
  if (!value) return "–";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("sv-SE");
}

export function InvoiceTable({ rows, showCustomer }: { rows: InvoiceRow[]; showCustomer?: boolean }) {
  return (
    <div className="space-y-4">
      {rows.map((r) => {
        const label = invoiceBuyerLabel(r.status, r.dueAt);
        return (
          <article key={r.id} className={CARD}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-medium">{r.invoiceNo}</p>
                <p className="mt-0.5 font-mono text-sm text-[#6b7280]">{r.orderNo}</p>
                {showCustomer ? <p className="mt-0.5 text-sm text-[#6b7280]">{r.customer}</p> : null}
              </div>
              <StatusChip
                status={r.status === "PAID" ? "PAID" : "INVOICED"}
                label={label}
                requestedDate={label === "Förfallen" ? "2000-01-01" : null}
              />
            </div>
            <p className="mt-4 text-sm text-[#6b7280]">{fmtDate(r.issuedAt ?? r.dueAt)}</p>
            <p className="mt-1 text-sm tabular-nums">{r.amountIncVat.toLocaleString("sv-SE")} kr</p>
            {r.pdfId ? (
              <div className="mt-4">
                <FileLink href={`/api/documents/${r.pdfId}`}>PDF</FileLink>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
