import { listAllOrders } from "@/server/services/order.service";
import { OrderResultsTable } from "@/ui/ops/OrderResultsTable";
import { Button, DashPage, EmptyState, PageHeader, controlCompact } from "@/ui/shell/primitives";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const term = q?.trim() ?? "";
  const orders = term ? await listAllOrders({ q: term }) : [];

  return (
    <DashPage>
      <PageHeader title="Sök" subtitle="Hitta order, kund, produkt, org.nr, kontakt, spårning eller faktura." />
      <form action="/operations/sok" className="av-card flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="ops-search-page">
          Sökterm
        </label>
        <input
          id="ops-search-page"
          name="q"
          defaultValue={term}
          autoFocus
          placeholder="AV-10450, produkt, org.nr, spårning…"
          className={controlCompact}
        />
        <Button type="submit" size="sm">
          Sök
        </Button>
      </form>
      {!term ? (
        <EmptyState title="Sök i ordrar" body="Skriv ordernummer, företag, org.nr, kontakt, produkt, faktura eller spårning." />
      ) : orders.length === 0 ? (
        <EmptyState title="Inga träffar" body={`Inget matchade “${term}”.`} />
      ) : (
        <OrderResultsTable orders={orders} />
      )}
    </DashPage>
  );
}
