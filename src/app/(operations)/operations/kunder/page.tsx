import { prisma } from "@/server/db";
import { listCustomers } from "@/server/services/customer.service";
import { createCustomerAction } from "@/actions/opsMasters";
import { priceListDisplayName } from "@/domain/priceLists";
import { Button, DashList, DashRow, EmptyState, PageHeader, Panel, controlClass } from "@/ui/shell/primitives";

const FIELD = controlClass;

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
      <PageHeader title="Kunder" subtitle="Företag, prislista, ordrar och repeat." />

      <form action="/operations/kunder" method="get" className="av-card grid gap-3 p-5 sm:grid-cols-[1fr_auto]">
        <input
          name="q"
          defaultValue={term}
          placeholder="Sök namn, org.nr, e-post"
          className={FIELD}
        />
        <Button type="submit">Sök</Button>
      </form>

      <Panel title="Ny kund">
        <form action={createCustomerAction} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-[var(--av-text-muted)]">
            Namn
            <input name="name" required className={`${FIELD} mt-1 text-[var(--av-text)]`} />
          </label>
          <label className="text-sm text-[var(--av-text-muted)]">
            Org.nr
            <input name="orgNr" className={`${FIELD} mt-1 text-[var(--av-text)]`} />
          </label>
          <label className="text-sm text-[var(--av-text-muted)]">
            E-post
            <input name="email" type="email" className={`${FIELD} mt-1 text-[var(--av-text)]`} />
          </label>
          <label className="text-sm text-[var(--av-text-muted)]">
            Telefon
            <input name="phone" type="tel" className={`${FIELD} mt-1 text-[var(--av-text)]`} />
          </label>
          <label className="text-sm text-[var(--av-text-muted)] sm:col-span-2">
            Prislista
            <select name="priceListId" className={`${FIELD} mt-1 text-[var(--av-text)]`}>
              <option value="">Ingen vald</option>
              {priceLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {priceListDisplayName(list.name)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[var(--av-text-muted)] sm:col-span-2">
            Adress
            <input name="line1" className={`${FIELD} mt-1 text-[var(--av-text)]`} />
          </label>
          <label className="text-sm text-[var(--av-text-muted)]">
            Postnr
            <input name="postalCode" className={`${FIELD} mt-1 text-[var(--av-text)]`} />
          </label>
          <label className="text-sm text-[var(--av-text-muted)]">
            Ort
            <input name="city" className={`${FIELD} mt-1 text-[var(--av-text)]`} />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit">Skapa kund</Button>
          </div>
        </form>
      </Panel>

      {customers.length === 0 ? (
        <EmptyState
          title={term ? "Inga träffar" : "Inga kunder"}
          body={term ? `Inget matchade “${term}”.` : "När kunder skapas syns de här."}
        />
      ) : (
        <DashList>
          {customers.map((c) => (
            <DashRow
              key={c.id}
              primary={c.name}
              primaryHref={`/operations/kunder/${c.id}`}
              columns={[
                priceListDisplayName(c.priceList?.name),
                c.orgNr ?? "Inget org.nr",
                `${c.orders.length} ordrar · nästa lead ${c.leads[0]?.expectedAt.toLocaleDateString("sv-SE") ?? "–"}`,
              ]}
            />
          ))}
        </DashList>
      )}
    </div>
  );
}
