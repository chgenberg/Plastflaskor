import Link from "next/link";
import { prisma } from "@/server/db";
import { listCustomers } from "@/server/services/customer.service";
import { createCustomerAction } from "@/actions/opsMasters";
import { priceListDisplayName } from "@/domain/priceLists";
import { Button, DataRow, DataTable, EmptyState, PageHeader, Panel } from "@/ui/shell/primitives";

const FIELD = "h-11 w-full rounded-full border border-black/10 bg-white px-4 text-sm";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = q?.trim() ?? "";
  const [customers, priceLists] = await Promise.all([
    listCustomers(term || undefined),
    prisma.priceList.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="Kunder" subtitle="Direktkunder och ÅF-kunder." />

      <form action="/operations/kunder" method="get" className="grid gap-3 rounded-[22px] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.04)] sm:grid-cols-[1fr_auto]">
        <input
          name="q"
          defaultValue={term}
          placeholder="Sök namn, org.nr, e-post, ÅF"
          className={FIELD}
        />
        <Button type="submit">Sök</Button>
      </form>

      <Panel title="Ny direktkund">
        <form action={createCustomerAction} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-[#6b7280]">
            Namn
            <input name="name" required className={`${FIELD} mt-1 text-[#1d1d1f]`} />
          </label>
          <label className="text-sm text-[#6b7280]">
            Org.nr
            <input name="orgNr" className={`${FIELD} mt-1 text-[#1d1d1f]`} />
          </label>
          <label className="text-sm text-[#6b7280]">
            E-post
            <input name="email" type="email" className={`${FIELD} mt-1 text-[#1d1d1f]`} />
          </label>
          <label className="text-sm text-[#6b7280]">
            Telefon
            <input name="phone" type="tel" className={`${FIELD} mt-1 text-[#1d1d1f]`} />
          </label>
          <label className="text-sm text-[#6b7280] sm:col-span-2">
            Prislista
            <select name="priceListId" className={`${FIELD} mt-1 text-[#1d1d1f]`}>
              <option value="">Ingen vald</option>
              {priceLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {priceListDisplayName(list.name)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[#6b7280] sm:col-span-2">
            Adress
            <input name="line1" className={`${FIELD} mt-1 text-[#1d1d1f]`} />
          </label>
          <label className="text-sm text-[#6b7280]">
            Postnr
            <input name="postalCode" className={`${FIELD} mt-1 text-[#1d1d1f]`} />
          </label>
          <label className="text-sm text-[#6b7280]">
            Ort
            <input name="city" className={`${FIELD} mt-1 text-[#1d1d1f]`} />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit">Skapa direktkund</Button>
          </div>
        </form>
      </Panel>

      {customers.length === 0 ? (
        <EmptyState
          title={term ? "Inga träffar" : "Inga kunder"}
          body={term ? `Inget matchade “${term}”.` : "När kunder skapas syns de här."}
        />
      ) : (
        <Panel padded={false}>
          <DataTable headers={[{ label: "Kund" }, { label: "Org.nr" }, { label: "Prislista" }, { label: "Ordrar", align: "right" }, { label: "Nästa lead" }]}>
            {customers.map((c) => (
              <DataRow key={c.id} href={`/operations/kunder/${c.id}`}>
                <td className="px-5 py-3">
                  <Link href={`/operations/kunder/${c.id}`} className="font-medium text-[#3B5BAA]">
                    {c.name}
                  </Link>
                  <p className="text-[12px] text-[#6b7280]">{c.reseller?.company.name ?? "Direktkund"}</p>
                </td>
                <td className="px-5 py-3 font-mono text-sm">{c.orgNr ?? "–"}</td>
                <td className="px-5 py-3">{priceListDisplayName(c.priceList?.name ?? c.reseller?.priceList.name)}</td>
                <td className="px-5 py-3 text-right tabular-nums">{c.orders.length}</td>
                <td className="px-5 py-3 text-sm text-[#6b7280]">
                  {c.leads[0]?.expectedAt.toLocaleDateString("sv-SE") ?? "–"}
                </td>
              </DataRow>
            ))}
          </DataTable>
        </Panel>
      )}
    </div>
  );
}
