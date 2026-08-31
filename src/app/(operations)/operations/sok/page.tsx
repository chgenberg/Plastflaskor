import { listAllOrders } from "@/server/services/order.service";
import { OrderResultsTable } from "@/ui/ops/OrderResultsTable";
import { EmptyState, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const term = q?.trim() ?? "";
  const orders = term ? await listAllOrders({ q: term }) : [];

  return (
    <div className="space-y-8">
      <PageHeader title="Sök" subtitle="Hitta order, kund, ÅF, produkt, org.nr, kontakt, spårning eller faktura." />
      <Panel>
        <form action="/operations/sok">
          <label className="block text-sm">
            Sökterm
            <input
              name="q"
              defaultValue={term}
              autoFocus
              placeholder="AV-10450, produkt, org.nr, spårning…"
              className="mt-2 h-11 w-full max-w-xl rounded-full border border-black/10 px-4 text-sm"
            />
          </label>
          <button type="submit" className="mt-4 inline-flex h-11 items-center rounded-full bg-[#5B7FD4] px-5 text-sm font-semibold text-white">
            Sök
          </button>
        </form>
      </Panel>
      {!term ? (
        <EmptyState title="Sök i ordrar" body="Skriv ordernummer, företag, org.nr, kontakt, produkt, faktura eller spårning." />
      ) : orders.length === 0 ? (
        <EmptyState title="Inga träffar" body={`Inget matchade “${term}”.`} />
      ) : (
        <section className="space-y-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
            {orders.length} träff{orders.length === 1 ? "" : "ar"}
          </h2>
          <OrderResultsTable orders={orders} />
        </section>
      )}
    </div>
  );
}
