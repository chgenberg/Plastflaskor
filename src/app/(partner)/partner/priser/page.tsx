import Link from "next/link";
import { requireRole } from "@/server/rbac";
import { priceListDisplayName } from "@/domain/priceLists";
import { getPricesForReseller, resolveUnitPrice } from "@/server/services/catalog.service";
import { DataRow, DataTable, EmptyState, LinkButton, PageHeader, Panel } from "@/ui/shell/primitives";

const QTYS = [500, 1000, 2500, 5000];

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
      <PageHeader title="Priser" subtitle={`Lista: ${priceListDisplayName(list.name)}`} action={<LinkButton href="/designa">Designa / Beställ</LinkButton>} />
      <div className="space-y-5">
        {[...grouped.entries()].map(([name, items]) => {
          const variants = new Map<string, typeof items>();
          for (const item of items) {
            variants.set(item.variantId, [...(variants.get(item.variantId) ?? []), item]);
          }
          return (
            <Panel
              key={name}
              title={
                <Link href={`/partner/priser/${items[0].variant.product.slug}`} className="text-[#1d1d1f] hover:text-[#3B5BAA]">
                  {name}
                </Link>
              }
              padded={false}
            >
              <DataTable
                headers={[
                  { label: "Variant" },
                  ...QTYS.map((n) => ({ label: `${n} st`, align: "right" as const })),
                ]}
              >
                {[...variants.entries()].map(([variantId, rows]) => (
                  <DataRow key={variantId}>
                    <td className="px-5 py-3">{rows[0].variant.name}</td>
                    {QTYS.map((n) => {
                      const price = resolveUnitPrice(rows, variantId, n);
                      return (
                        <td key={n} className="px-5 py-3 text-right tabular-nums">
                          {price ? `${price.unitPriceExVat.toFixed(2)} kr` : "–"}
                        </td>
                      );
                    })}
                  </DataRow>
                ))}
              </DataTable>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
