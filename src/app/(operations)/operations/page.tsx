import { listAllOrders } from "@/server/services/order.service";
import { weekProduction } from "@/server/services/production.service";
import { ActionRow, DataRow, DataTable, EmptyState, KpiCard, PageHeader, Panel } from "@/ui/shell/primitives";
import { PIPELINE_PHASES } from "@/domain/enums";

export default async function OpsHome() {
  const orders = await listAllOrders();
  const start = new Date();
  start.setDate(start.getDate() - start.getDay() + 1);
  start.setHours(0, 0, 0, 0);
  const jobs = await weekProduction(start);
  const bottles = jobs.reduce((s, j) => s + j.order.items.reduce((a, i) => a + i.qty, 0), 0);
  const missingArt = orders.filter((o) => o.currentStatus === "ORDER_RECEIVED").length;
  const labelsShip = orders.filter((o) => o.currentStatus === "LABELS_PRINTED").length;
  const waybill = orders.filter((o) => o.currentStatus === "PRODUCTION_DONE").length;
  const late = orders.filter((o) => o.currentStatus === "PRODUCTION_PLANNED").length;

  const byDay = new Map<string, { size33: number; size50: number; still: number; spark: number }>();
  for (const job of jobs) {
    const day = job.plannedAt ? job.plannedAt.toLocaleDateString("sv-SE", { weekday: "long" }) : "okänd";
    const row = byDay.get(day) ?? { size33: 0, size50: 0, still: 0, spark: 0 };
    for (const item of job.order.items) {
      const ml = item.variant.volumeMl ?? 0;
      if (ml <= 330) row.size33 += item.qty;
      else row.size50 += item.qty;
      const opt = JSON.parse(item.variant.optionsJson || "{}") as { waterType?: string };
      if (opt.waterType === "kolsyrat") row.spark += item.qty;
      else row.still += item.qty;
    }
    byDay.set(day, row);
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Idag" subtitle={`Den här veckan · ${bottles.toLocaleString("sv-SE")} flaskor`} />
      <Panel title="Produktion denna vecka" padded={false}>
        {byDay.size === 0 ? (
          <div className="p-5">
            <EmptyState title="Ingen planerad produktion" body="När jobb läggs i veckan syns 33/50 cl och stilla/kolsyrat här." />
          </div>
        ) : (
          <DataTable
            headers={[
              { label: "Produktion" },
              { label: "33 cl", align: "right" },
              { label: "50 cl", align: "right" },
              { label: "Stilla", align: "right" },
              { label: "Kolsyrat", align: "right" },
            ]}
          >
            {[...byDay.entries()].map(([day, r]) => (
              <DataRow key={day}>
                <td className="px-5 py-2.5 capitalize">{day}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{r.size33 || "–"}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{r.size50 || "–"}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{r.still || "–"}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{r.spark || "–"}</td>
              </DataRow>
            ))}
          </DataTable>
        )}
      </Panel>
      <Panel title="Behöver åtgärd idag">
        <div className="divide-y divide-black/5">
          <ActionRow href="/operations/ordrar?phase=awaiting_artwork" label="Ordrar saknar godkänt artwork" value={missingArt} />
          <ActionRow href="/operations/etiketter" label="Etikettordrar behöver skickas" value={labelsShip} />
          <ActionRow href="/operations/ordrar?phase=ready_ship" label="Leveranser saknar fraktsedel" value={waybill} />
          <ActionRow href="/operations/produktion" label="Produktioner riskerar att bli försenade" value={late} />
        </div>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PIPELINE_PHASES.map((p) => (
          <KpiCard
            key={p.id}
            label={p.label}
            value={orders.filter((o) => (p.statuses as readonly string[]).includes(o.currentStatus)).length}
            href={`/operations/ordrar?phase=${p.id}`}
          />
        ))}
      </div>
    </div>
  );
}
