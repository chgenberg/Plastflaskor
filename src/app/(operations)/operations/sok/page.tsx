import { listAllOrders } from "@/server/services/order.service";
import { OrderResultsTable } from "@/ui/ops/OrderResultsTable";
import { Button, EmptyState, PageHeader, Panel, SectionTitle, controlClass } from "@/ui/shell/primitives";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const term = q?.trim() ?? "";
  const orders = term ? await listAllOrders({ q: term }) : [];

  return (
    <div className="space-y-7">
      <PageHeader title="Sök" subtitle="Hitta order, kund, produkt, org.nr, kontakt, spårning eller faktura." />
      <Panel>
        <form action="/operations/sok" className="space-y-4">
          <label className="block text-[14px]">
            Sökterm
            <input
              name="q"
              defaultValue={term}
              autoFocus
              placeholder="AV-10450, produkt, org.nr, spårning…"
              className={`${controlClass} mt-2 max-w-xl`}
            />
          </label>
          <Button type="submit">Sök</Button>
        </form>
      </Panel>
      {!term ? (
        <EmptyState title="Sök i ordrar" body="Skriv ordernummer, företag, org.nr, kontakt, produkt, faktura eller spårning." />
      ) : orders.length === 0 ? (
        <EmptyState title="Inga träffar" body={`Inget matchade “${term}”.`} />
      ) : (
        <section className="space-y-4">
          <SectionTitle>
            {orders.length} träff{orders.length === 1 ? "" : "ar"}
          </SectionTitle>
          <OrderResultsTable orders={orders} />
        </section>
      )}
    </div>
  );
}
