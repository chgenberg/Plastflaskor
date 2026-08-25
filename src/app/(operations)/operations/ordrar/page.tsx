import Link from "next/link";
import { listAllOrders } from "@/server/services/order.service";
import { PIPELINE_PHASES, ORDER_STEP_LABELS } from "@/domain/enums";
import { DataRow, DataTable, EmptyState, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";

export default async function OpsOrders({ searchParams }: { searchParams: Promise<{ phase?: string; q?: string }> }) {
  const { phase, q } = await searchParams;
  const phaseDef = PIPELINE_PHASES.find((p) => p.id === phase);
  const orders = await listAllOrders({
    q,
    phaseStatuses: phaseDef ? [...phaseDef.statuses] : undefined,
  });
  return (
    <div className="space-y-8">
      <PageHeader title={phaseDef?.label ?? "Alla ordrar"} subtitle="Sök på order, kund, ÅF, tracking eller faktura." />
      <form>
        <input
          name="q"
          defaultValue={q}
          placeholder="Sök order, kund, ÅF, tracking, faktura"
          className="h-11 w-full max-w-xl rounded-full border border-black/10 bg-white px-4 text-sm"
        />
      </form>
      {orders.length === 0 ? (
        <EmptyState title="Inga ordrar" body={q || phase ? "Inget matchade filtret." : "När ordrar kommer in syns de här."} />
      ) : (
        <Panel padded={false}>
          <DataTable
            headers={[
              { label: "Order" },
              { label: "Kund" },
              { label: "ÅF" },
              { label: "Produkt" },
              { label: "Antal", align: "right" },
              { label: "Status" },
            ]}
          >
            {orders.map((o) => (
              <DataRow key={o.id} href={`/operations/ordrar/${o.orderNo}`}>
                <td className="px-5 py-3">
                  <Link href={`/operations/ordrar/${o.orderNo}`} className="font-mono text-[#3B5BAA]">
                    {o.orderNo}
                  </Link>
                </td>
                <td className="px-5 py-3">{o.customer.name}</td>
                <td className="px-5 py-3">{o.reseller.company.name}</td>
                <td className="px-5 py-3">{o.items[0]?.variant.product.name}</td>
                <td className="px-5 py-3 text-right tabular-nums">{o.items[0]?.qty}</td>
                <td className="px-5 py-3">
                  <StatusChip status={o.currentStatus} label={ORDER_STEP_LABELS[o.currentStatus]} />
                </td>
              </DataRow>
            ))}
          </DataTable>
        </Panel>
      )}
    </div>
  );
}
