import { requireRole } from "@/server/rbac";
import { getPricesForReseller } from "@/server/services/catalog.service";
import { DataRow, DataTable, EmptyState, LinkButton, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function PricesPage() {
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  if (!user.resellerId) {
    return (
      <div className="space-y-8">
        <PageHeader title="Priser" subtitle="Nettopriser för din lista." />
        <EmptyState title="Ingen prislista kopplad" body="Logga in som återförsäljare för att se era nettopriser." />
      </div>
    );
  }
  const list = await getPricesForReseller(user.resellerId);
  if (!list) {
    return (
      <div className="space-y-8">
        <PageHeader title="Priser" />
        <EmptyState title="Ingen prislista kopplad" body="Kontakta Aqua Visibility om listan saknas." />
      </div>
    );
  }
  const grouped = new Map<string, typeof list.items>();
  for (const item of list.items) {
    const key = item.variant.product.name;
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Priser" subtitle={`Lista: ${list.name}`} action={<LinkButton href="/designa">Designa / Beställ</LinkButton>} />
      <div className="space-y-5">
        {[...grouped.entries()].map(([name, items]) => (
          <Panel key={name} title={name} padded={false}>
            <DataTable
              headers={[
                { label: "Variant" },
                { label: "Från antal" },
                { label: "Nettopris", align: "right" },
              ]}
            >
              {items.map((i) => (
                <DataRow key={i.id}>
                  <td className="px-5 py-3">{i.variant.name}</td>
                  <td className="px-5 py-3 tabular-nums">{i.minQty}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{i.unitPriceExVat.toFixed(2)} kr</td>
                </DataRow>
              ))}
            </DataTable>
          </Panel>
        ))}
      </div>
    </div>
  );
}
