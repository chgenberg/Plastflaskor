import Link from "next/link";
import { listAllOrders } from "@/server/services/order.service";
import { PIPELINE_PHASES, ORDER_STEP_LABELS } from "@/domain/enums";
import { StatusChip } from "@/ui/shell/primitives";

export default async function OpsOrders({ searchParams }: { searchParams: Promise<{ phase?: string; q?: string }> }) {
  const { phase, q } = await searchParams;
  const phaseDef = PIPELINE_PHASES.find((p) => p.id === phase);
  const orders = await listAllOrders({
    q,
    phaseStatuses: phaseDef ? [...phaseDef.statuses] : undefined,
  });
  return (
    <div>
      <form className="mb-4">
        <input name="q" defaultValue={q} placeholder="Sök order, kund, ÅF, tracking, faktura" className="h-11 w-full max-w-xl rounded-xl border px-3" />
      </form>
      <h1 className="text-3xl font-semibold">{phaseDef?.label ?? "Alla ordrar"}</h1>
      <div className="mt-6 overflow-hidden rounded-2xl bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-[var(--av-text-muted)]">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th>Kund</th>
              <th>ÅF</th>
              <th>Produkt</th>
              <th className="text-right">Antal</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-4 py-3">
                  <Link href={`/operations/ordrar/${o.orderNo}`} className="font-mono text-[var(--av-accent)]">
                    {o.orderNo}
                  </Link>
                </td>
                <td>{o.customer.name}</td>
                <td>{o.reseller.company.name}</td>
                <td>{o.items[0]?.variant.product.name}</td>
                <td className="text-right">{o.items[0]?.qty}</td>
                <td>
                  <StatusChip status={o.currentStatus} label={ORDER_STEP_LABELS[o.currentStatus]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
