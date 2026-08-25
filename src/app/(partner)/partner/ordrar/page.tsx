import Link from "next/link";
import { requireRole } from "@/server/rbac";
import { listOrdersForReseller } from "@/server/services/order.service";
import { DataRow, DataTable, EmptyState, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";
import { RESELLER_STATUS } from "@/domain/enums";

export default async function PartnerOrders({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; product?: string; from?: string; to?: string; status?: string; delivered?: string; artwork?: string }>;
}) {
  const { q, product, from, to, status, delivered, artwork } = await searchParams;
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const orders = user.resellerId ? await listOrdersForReseller(user.resellerId) : [];
  const products = [...new Set(orders.map((o) => o.items[0]?.variant.product.name).filter(Boolean))] as string[];
  const statuses = [...new Set(orders.map((o) => o.currentStatus))];
  const filtered = orders.filter((o) => {
    const hay = `${o.orderNo} ${o.customer.name} ${o.items[0]?.variant.product.name}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (product && o.items[0]?.variant.product.name !== product) return false;
    if (status && o.currentStatus !== status) return false;
    if (delivered === "1" && !["DELIVERED", "INVOICED", "PAID"].includes(o.currentStatus)) return false;
    if (artwork === "1" && !o.items.some((i) => i.designId) && o.designs.length === 0) return false;
    if (from && o.createdAt < new Date(from)) return false;
    if (to && o.createdAt > new Date(`${to}T23:59:59`)) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Ordrar" subtitle="Filtrera på produkt, datum, status, leverans och artwork." />
      <form className="grid gap-3 rounded-[22px] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.04)] sm:grid-cols-2 lg:grid-cols-3">
        <input name="q" defaultValue={q} placeholder="Sök kund, ordernummer" className="h-11 rounded-full border border-black/10 px-4 text-sm" />
        <select name="product" defaultValue={product ?? ""} className="h-11 rounded-full border border-black/10 px-4 text-sm">
          <option value="">Alla produkter</option>
          {products.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="h-11 rounded-full border border-black/10 px-4 text-sm">
          <option value="">Alla statusar</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {RESELLER_STATUS[s] ?? s}
            </option>
          ))}
        </select>
        <label className="text-sm text-[#6b7280]">
          Från
          <input type="date" name="from" defaultValue={from} className="mt-1 h-11 w-full rounded-full border border-black/10 px-4 text-sm text-[#1d1d1f]" />
        </label>
        <label className="text-sm text-[#6b7280]">
          Till
          <input type="date" name="to" defaultValue={to} className="mt-1 h-11 w-full rounded-full border border-black/10 px-4 text-sm text-[#1d1d1f]" />
        </label>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="delivered" value="1" defaultChecked={delivered === "1"} />
            Levererade
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="artwork" value="1" defaultChecked={artwork === "1"} />
            Har artwork
          </label>
          <button type="submit" className="h-11 rounded-full bg-[#5B7FD4] px-5 text-sm font-semibold text-white">
            Filtrera
          </button>
        </div>
      </form>
      {!user.resellerId ? (
        <EmptyState title="Ingen återförsäljare kopplad" body="Orderhistorik visas bara för ett ÅF-konto." />
      ) : filtered.length === 0 ? (
        <EmptyState title="Inga ordrar" body={q || product || status ? "Inget matchade filtret." : "När du lägger en order syns den här."} />
      ) : (
        <Panel padded={false}>
          <DataTable
            headers={[
              { label: "Order" },
              { label: "Kund" },
              { label: "Produkt" },
              { label: "Antal", align: "right" },
              { label: "Leverans" },
              { label: "Värde", align: "right" },
              { label: "Status" },
            ]}
          >
            {filtered.map((o) => {
              const value = o.items.reduce((s, i) => s + i.unitPriceExVat * i.qty, 0);
              return (
                <DataRow key={o.id} href={`/partner/ordrar/${o.orderNo}`}>
                  <td className="px-5 py-3">
                    <Link href={`/partner/ordrar/${o.orderNo}`} className="font-mono text-[#3B5BAA]">
                      {o.orderNo}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{o.customer.name}</td>
                  <td className="px-5 py-3">{o.items[0]?.variant.product.name}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{o.items[0]?.qty}</td>
                  <td className="px-5 py-3 text-[#6b7280]">{o.requestedDate ?? "–"}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{value.toLocaleString("sv-SE")} kr</td>
                  <td className="px-5 py-3">
                    <StatusChip status={o.currentStatus} label={RESELLER_STATUS[o.currentStatus]} requestedDate={o.requestedDate} />
                  </td>
                </DataRow>
              );
            })}
          </DataTable>
        </Panel>
      )}
    </div>
  );
}
