import { listAllOrders } from "@/server/services/order.service";
import { weekProduction } from "@/server/services/production.service";
import { exceptionSummary, exceptionsFor } from "@/domain/exceptions";
import { PIPELINE_PHASES } from "@/domain/enums";
import { ActionRow, DataRow, DataTable, EmptyState, KpiCard, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function OpsHome() {
  const orders = await listAllOrders();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const jobs = await weekProduction(start);
  const bottles = jobs.reduce((s, j) => s + j.order.items.reduce((a, i) => a + i.qty, 0), 0);
  const tasks = exceptionSummary(exceptionsFor(orders));

  const byDay = new Map<string, { size33: number; size50: number; still: number; spark: number; cap: number; label: number }>();
  for (const job of jobs) {
    const day = job.plannedAt ? job.plannedAt.toLocaleDateString("sv-SE", { weekday: "long" }) : "okänd";
    const row = byDay.get(day) ?? { size33: 0, size50: 0, still: 0, spark: 0, cap: 0, label: 0 };
    for (const item of job.order.items) {
      const ml = item.variant.volumeMl ?? 0;
      if (ml <= 330) row.size33 += item.qty;
      else row.size50 += item.qty;
      const opt = JSON.parse(item.variant.optionsJson || "{}") as { waterType?: string; cap?: string; label?: string };
      if (opt.waterType === "kolsyrat") row.spark += item.qty;
      else row.still += item.qty;
      if (opt.cap) row.cap += item.qty;
      if (opt.label) row.label += item.qty;
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
              { label: "Kapsyl", align: "right" },
              { label: "Etikett", align: "right" },
            ]}
          >
            {[...byDay.entries()].map(([day, r]) => (
              <DataRow key={day}>
                <td className="px-5 py-2.5 capitalize">{day}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{r.size33 || "–"}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{r.size50 || "–"}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{r.still || "–"}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{r.spark || "–"}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{r.cap || "–"}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{r.label || "–"}</td>
              </DataRow>
            ))}
          </DataTable>
        )}
      </Panel>
      <Panel title="Behöver åtgärd idag">
        {tasks.length === 0 ? (
          <p className="text-sm text-[#6b7280]">Inget som kräver åtgärd just nu.</p>
        ) : (
          <div className="divide-y divide-black/5">
            {tasks.map((t) => (
              <ActionRow key={t.kind} href={t.href} label={t.label} value={t.count} />
            ))}
          </div>
        )}
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
