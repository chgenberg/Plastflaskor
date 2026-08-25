import Link from "next/link";
import { listAllOrders } from "@/server/services/order.service";
import { PIPELINE_PHASES } from "@/domain/enums";

export default async function PipelinePage() {
  const orders = await listAllOrders();
  return (
    <div>
      <h1 className="text-3xl font-semibold">Pipelineöversikt</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PIPELINE_PHASES.map((p) => {
          const count = orders.filter((o) => (p.statuses as readonly string[]).includes(o.currentStatus)).length;
          return (
            <Link key={p.id} href={`/operations/ordrar?phase=${p.id}`} className="rounded-2xl bg-white p-6">
              <p className="text-sm text-[var(--av-text-muted)]">{p.label}</p>
              <p className="mt-2 text-3xl font-semibold">{count}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
