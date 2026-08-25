import Link from "next/link";
import { requireRole } from "@/server/rbac";
import { listOrdersForReseller } from "@/server/services/order.service";
import { StatusChip } from "@/ui/shell/primitives";
import { RESELLER_STATUS } from "@/domain/enums";

export default async function PartnerOrders({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const orders = user.resellerId ? await listOrdersForReseller(user.resellerId) : [];
  const filtered = q ? orders.filter((o) => `${o.orderNo} ${o.customer.name}`.toLowerCase().includes(q.toLowerCase())) : orders;

  return (
    <div>
      <h1 className="text-3xl font-semibold">Orderhistorik</h1>
      <form className="mt-4">
        <input name="q" defaultValue={q} placeholder="Sök kund, ordernummer" className="h-11 w-full max-w-md rounded-xl border px-3" />
      </form>
      <div className="mt-6 overflow-hidden rounded-2xl bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-[var(--av-text-muted)]">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th>Kund</th>
              <th>Produkt</th>
              <th className="text-right">Antal</th>
              <th className="text-right">Värde</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const value = o.items.reduce((s, i) => s + i.unitPriceExVat * i.qty, 0);
              return (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link href={`/partner/ordrar/${o.orderNo}`} className="font-mono text-[var(--av-accent)]">
                      {o.orderNo}
                    </Link>
                  </td>
                  <td>{o.customer.name}</td>
                  <td>{o.items[0]?.variant.product.name}</td>
                  <td className="text-right">{o.items[0]?.qty}</td>
                  <td className="text-right tabular-nums">{value.toLocaleString("sv-SE")} kr</td>
                  <td>
                    <StatusChip status={o.currentStatus} label={RESELLER_STATUS[o.currentStatus]} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
