import Link from "next/link";
import { requireRole } from "@/server/rbac";
import { listOrdersForReseller } from "@/server/services/order.service";
import { DataRow, DataTable, EmptyState, KpiCard, LinkButton, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";
import { RESELLER_STATUS } from "@/domain/enums";

export default async function PartnerHome() {
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const resellerId = user.resellerId;
  const firstName = user.name?.split(" ")[0] ?? "där";
  const orders = resellerId ? await listOrdersForReseller(resellerId) : [];
  const active = orders.filter((o) => !["PAID", "DELIVERED"].includes(o.currentStatus)).length;
  const proof = orders.filter((o) => o.currentStatus === "ARTWORK_UPLOADED").length;
  const prod = orders.filter((o) => ["LABELS_ORDERED", "PRODUCTION_STARTED", "PRODUCTION_PLANNED"].includes(o.currentStatus)).length;
  const shipped = orders.filter((o) => ["SHIPPED_TO_END_CUSTOMER", "WAYBILL_CREATED"].includes(o.currentStatus)).length;

  if (!resellerId) {
    return (
      <div className="space-y-8">
        <PageHeader title={`Hej ${firstName}`} subtitle="ÅF-portalen visar ordrar för en kopplad återförsäljare." />
        <EmptyState title="Ingen återförsäljare kopplad" body="Det här kontot har ingen prislista eller orderhistorik. Logga in som ÅF för att se ordrar och priser." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hej ${firstName}`}
        subtitle="Ordrar, korrektur och leveranser för din lista."
        action={<LinkButton href="/designa">Ny order</LinkButton>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Aktiva ordrar" value={active} href="/partner/ordrar" />
        <KpiCard label="Väntar på korrektur" value={proof} href="/partner/ordrar" />
        <KpiCard label="I produktion" value={prod} href="/partner/ordrar" />
        <KpiCard label="Skickade" value={shipped} href="/partner/ordrar" />
      </div>
      {orders.length === 0 ? (
        <EmptyState title="Inga ordrar ännu" body="När du lägger en order syns den här. Starta i studion eller beställ från prislistan." />
      ) : (
        <Panel title="Senaste ordrar" padded={false}>
          <DataTable
            headers={[
              { label: "Order" },
              { label: "Kund" },
              { label: "Produkt" },
              { label: "Antal", align: "right" },
              { label: "Status" },
              { label: "" },
            ]}
          >
            {orders.slice(0, 8).map((o) => (
              <DataRow key={o.id} href={`/partner/ordrar/${o.orderNo}`}>
                <td className="px-5 py-3">
                  <Link href={`/partner/ordrar/${o.orderNo}`} className="font-mono text-[#3B5BAA]">
                    {o.orderNo}
                  </Link>
                </td>
                <td className="px-5 py-3">{o.customer.name}</td>
                <td className="px-5 py-3">{o.items[0]?.variant.product.name}</td>
                <td className="px-5 py-3 text-right tabular-nums">{o.items[0]?.qty}</td>
                <td className="px-5 py-3">
                  <StatusChip status={o.currentStatus} label={RESELLER_STATUS[o.currentStatus]} />
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/partner/ordrar/${o.orderNo}/repeat`} className="text-[13px] font-medium text-[#3B5BAA]">
                    Beställ igen
                  </Link>
                </td>
              </DataRow>
            ))}
          </DataTable>
        </Panel>
      )}
    </div>
  );
}
