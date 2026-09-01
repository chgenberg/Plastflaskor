import Link from "next/link";
import { ORDER_STEP_LABELS, invoiceBuyerLabel, type OrderStatusCode } from "@/domain/enums";
import { parseExtras } from "@/domain/extras";
import { isOverdue } from "@/domain/orderBrief";
import { StatusChip } from "@/ui/shell/primitives";

function rowValue(order: {
  items: { qty: number; unitPriceExVat: number }[];
  extrasJson?: string | null;
  priceSnapshotJson?: string | null;
}) {
  if (order.priceSnapshotJson) {
    try {
      return (JSON.parse(order.priceSnapshotJson) as { amountExVat: number }).amountExVat;
    } catch {
      /* fall through */
    }
  }
  const goods = order.items.reduce((sum, item) => sum + item.unitPriceExVat * item.qty, 0);
  return Math.round((goods + parseExtras(order.extrasJson).reduce((sum, extra) => sum + extra.amountExVat, 0)) * 100) / 100;
}

type ResultOrder = {
  id: string;
  orderNo: string;
  currentStatus: string;
  createdAt: Date;
  requestedDate: string | null;
  factoryIssueNote: string | null;
  factoryDeadlineAccepted: boolean;
  deliveryRequirement?: string | null;
  invoiceRef?: string | null;
  invoice?: { status: string; dueAt?: Date | string | null } | null;
  customer: { name: string; orgNr?: string | null };
  items: {
    qty: number;
    unitPriceExVat: number;
    variant: { volumeMl: number | null; optionsJson: string; product: { name: string; slug: string } };
  }[];
  extrasJson?: string | null;
  priceSnapshotJson?: string | null;
};

function fmtDate(value?: Date | string | null) {
  if (!value) return "–";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("sv-SE");
}

export function OrderResultsTable({ orders, hrefBase = "/operations/ordrar" }: { orders: ResultOrder[]; hrefBase?: string }) {
  return (
    <div className="overflow-x-auto av-card">
      <table className="av-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Datum</th>
            <th>Kund</th>
            <th>Innehåll</th>
            <th>Status</th>
            <th>Betalning</th>
            <th>Leverans</th>
            <th className="av-num">Pris</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const href = `${hrefBase}/${o.orderNo}`;
            const item = o.items[0];
            const late = isOverdue(o.currentStatus, o.requestedDate);
            const flagged = Boolean(o.factoryIssueNote) && !o.factoryDeadlineAccepted;
            const product = item ? item.variant.product.name : "–";
            const qty = item ? `${item.qty.toLocaleString("sv-SE")} st` : "";
            const pay =
              !o.invoice || o.invoice.status === "NOT_READY"
                ? "Ej fakturerad"
                : invoiceBuyerLabel(o.invoice.status, o.invoice.dueAt);
            const value = rowValue(o);
            return (
              <tr key={o.id}>
                <td>
                  <Link href={href} className="font-semibold text-[var(--av-text)] hover:text-[var(--av-accent)]">
                    {o.orderNo}
                  </Link>
                  {o.invoiceRef ? <p className="text-[11px] text-[var(--av-text-muted)]">{o.invoiceRef}</p> : null}
                </td>
                <td className="whitespace-nowrap tabular-nums text-[var(--av-text-muted)]">{fmtDate(o.createdAt)}</td>
                <td>
                  <p className="font-medium text-[var(--av-text)]">{o.customer.name}</p>
                  {o.customer.orgNr ? <p className="text-[11px] text-[var(--av-text-muted)]">{o.customer.orgNr}</p> : null}
                </td>
                <td>
                  <p className="text-[var(--av-text)]">{product}</p>
                  {qty ? <p className="text-[11px] text-[var(--av-text-muted)]">{qty}</p> : null}
                </td>
                <td>
                  <StatusChip
                    status={o.currentStatus}
                    label={ORDER_STEP_LABELS[o.currentStatus as OrderStatusCode]}
                    requestedDate={o.requestedDate}
                  />
                </td>
                <td>
                  <StatusChip
                    status={pay === "Betald" ? "PAID" : pay === "Förfallen" ? "INVOICED" : "SUBMITTED"}
                    label={pay}
                    requestedDate={pay === "Förfallen" ? "2000-01-01" : null}
                  />
                </td>
                <td>
                  <span className={late ? "font-medium text-[var(--av-status-blocked-fg)]" : "text-[var(--av-text-secondary)]"}>
                    {o.requestedDate ? o.requestedDate : "–"}
                    {o.deliveryRequirement ? " · krav" : ""}
                    {flagged ? " · flagga" : ""}
                  </span>
                </td>
                <td className="av-num font-semibold tabular-nums">{value.toLocaleString("sv-SE")} kr</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
