import Link from "next/link";
import { requireRole } from "@/server/rbac";
import { listOrdersForReseller } from "@/server/services/order.service";
import { DataRow, DataTable, EmptyState, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";
import { RESELLER_STATUS } from "@/domain/enums";

export default async function PartnerOrders({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const orders = user.resellerId ? await listOrdersForReseller(user.resellerId) : [];
  const filtered = q ? orders.filter((o) => `${o.orderNo} ${o.customer.name}`.toLowerCase().includes(q.toLowerCase())) : orders;

  return (
    <div className="space-y-8">
      <PageHeader title="Ordrar" subtitle="Sök på kund eller ordernummer." />
      <form>
        <input
          name="q"
          defaultValue={q}
          placeholder="Sök kund, ordernummer"
          className="h-11 w-full max-w-md rounded-full border border-black/10 bg-white px-4 text-sm"
        />
      </form>
      {!user.resellerId ? (
        <EmptyState title="Ingen återförsäljare kopplad" body="Orderhistorik visas bara för ett ÅF-konto." />
      ) : filtered.length === 0 ? (
        <EmptyState title="Inga ordrar" body={q ? "Inget matchade sökningen." : "När du lägger en order syns den här."} />
      ) : (
        <Panel padded={false}>
          <DataTable
            headers={[
              { label: "Order" },
              { label: "Kund" },
              { label: "Produkt" },
              { label: "Antal", align: "right" },
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
                  <td className="px-5 py-3 text-right tabular-nums">{value.toLocaleString("sv-SE")} kr</td>
                  <td className="px-5 py-3">
                    <StatusChip status={o.currentStatus} label={RESELLER_STATUS[o.currentStatus]} />
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
