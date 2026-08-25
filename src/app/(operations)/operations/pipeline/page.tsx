import { listAllOrders } from "@/server/services/order.service";
import { KpiCard, PageHeader } from "@/ui/shell/primitives";
import { PIPELINE_PHASES } from "@/domain/enums";

export default async function PipelinePage() {
  const orders = await listAllOrders();
  return (
    <div className="space-y-8">
      <PageHeader title="Pipeline" subtitle="Ordrar per fas. Klicka för att öppna listan." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PIPELINE_PHASES.map((p) => {
          const count = orders.filter((o) => (p.statuses as readonly string[]).includes(o.currentStatus)).length;
          return <KpiCard key={p.id} label={p.label} value={count} href={`/operations/ordrar?phase=${p.id}`} />;
        })}
      </div>
    </div>
  );
}
