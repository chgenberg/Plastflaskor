import Link from "next/link";
import { requireRole } from "@/server/rbac";
import { getPricesForReseller } from "@/server/services/catalog.service";

export default async function PricesPage() {
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  if (!user.resellerId) return <p>Ingen prislista kopplad.</p>;
  const list = await getPricesForReseller(user.resellerId);
  if (!list) return <p>Ingen prislista kopplad.</p>;
  const grouped = new Map<string, typeof list.items>();
  for (const item of list?.items ?? []) {
    const key = item.variant.product.name;
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold">Priser</h1>
      <p className="mt-2 text-sm text-[var(--av-text-secondary)]">Lista: {list?.name}</p>
      <div className="mt-8 space-y-6">
        {[...grouped.entries()].map(([name, items]) => (
          <section key={name} className="rounded-2xl bg-white p-5 shadow-[var(--av-shadow-sm)]">
            <h2 className="font-semibold">{name}</h2>
            <table className="mt-3 w-full text-sm">
              <thead className="text-left text-xs text-[var(--av-text-muted)]">
                <tr>
                  <th>Variant</th>
                  <th>Från antal</th>
                  <th className="text-right">Nettopris</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="py-2">{i.variant.name}</td>
                    <td>{i.minQty}</td>
                    <td className="text-right tabular-nums">{i.unitPriceExVat.toFixed(2)} kr</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Link href="/designa" className="mt-3 inline-block text-sm text-[var(--av-accent)]">
              Designa / Beställ
            </Link>
          </section>
        ))}
      </div>
    </div>
  );
}
