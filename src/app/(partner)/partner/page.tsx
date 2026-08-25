import Link from "next/link";
import { requireRole } from "@/server/rbac";
import { listOrdersForReseller } from "@/server/services/order.service";
import { KpiCard, StatusChip } from "@/ui/shell/primitives";
import { RESELLER_STATUS } from "@/domain/enums";

export default async function PartnerHome() {
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const resellerId = user.resellerId;
  const orders = resellerId ? await listOrdersForReseller(resellerId) : [];
  const active = orders.filter((o) => !["PAID", "DELIVERED"].includes(o.currentStatus)).length;
  const proof = orders.filter((o) => o.currentStatus === "ARTWORK_UPLOADED").length;
  const prod = orders.filter((o) => ["LABELS_ORDERED", "PRODUCTION_STARTED", "PRODUCTION_PLANNED"].includes(o.currentStatus)).length;
  const shipped = orders.filter((o) => ["SHIPPED_TO_END_CUSTOMER", "WAYBILL_CREATED"].includes(o.currentStatus)).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Översikt</h1>
        <Link href="/designa" className="rounded-xl bg-[var(--av-accent)] px-4 py-2 text-sm text-white">
          Ny order
        </Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <KpiCard label="Aktiva ordrar" value={active} href="/partner/ordrar" />
        <KpiCard label="Väntar på korrektur" value={proof} href="/partner/ordrar" />
        <KpiCard label="I produktion" value={prod} href="/partner/ordrar" />
        <KpiCard label="Skickade" value={shipped} href="/partner/ordrar" />
      </div>
      <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-[var(--av-shadow-sm)]">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-[var(--av-text-muted)]">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th>Kund</th>
              <th>Produkt</th>
              <th className="text-right">Antal</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 8).map((o) => (
              <tr key={o.id} className="border-t border-[var(--av-border)]">
                <td className="px-4 py-3 font-mono">{o.orderNo}</td>
                <td>{o.customer.name}</td>
                <td>{o.items[0]?.variant.product.name}</td>
                <td className="text-right tabular-nums">{o.items[0]?.qty}</td>
                <td>
                  <StatusChip status={o.currentStatus} label={RESELLER_STATUS[o.currentStatus]} />
                </td>
                <td className="pr-4 text-right">
                  <Link href={`/partner/ordrar/${o.orderNo}/repeat`} className="text-[var(--av-accent)]">
                    Beställ igen
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
