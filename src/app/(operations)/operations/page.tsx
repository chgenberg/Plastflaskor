import { listAllOrders } from "@/server/services/order.service";
import { weekProduction } from "@/server/services/production.service";
import { activateDueLeads, listLeads } from "@/server/services/lead.service";
import { exceptionSummary, exceptionsFor } from "@/domain/exceptions";
import { ActionCard, DataRow, DataTable, EmptyState, LinkButton, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function OpsHome() {
  const orders = await listAllOrders();
  await activateDueLeads();
  const { buckets } = await listLeads();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const jobs = await weekProduction(start);
  const cups = jobs.reduce((s, j) => s + j.order.items.reduce((a, i) => a + i.qty, 0), 0);
  const tasks = exceptionSummary(exceptionsFor(orders));

  const byDay = new Map<string, { ev: number; dv: number; eco: number }>();
  for (const job of jobs) {
    const day = job.plannedAt ? job.plannedAt.toLocaleDateString("sv-SE", { weekday: "long" }) : "okänd";
    const row = byDay.get(day) ?? { ev: 0, dv: 0, eco: 0 };
    for (const item of job.order.items) {
      const opt = JSON.parse(item.variant.optionsJson || "{}") as { wall?: string; eco?: string };
      if (opt.wall === "dubbel") row.dv += item.qty;
      else row.ev += item.qty;
      if (opt.eco === "ja") row.eco += item.qty;
    }
    byDay.set(day, row);
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Vad behöver du göra nu?"
        subtitle={`Kräver åtgärd · ${cups.toLocaleString("sv-SE")} muggar denna vecka`}
        action={
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/operations/pipeline">Öppna pipeline</LinkButton>
            <LinkButton href="/operations/visning" variant="secondary">Visning</LinkButton>
            <LinkButton href="/operations/ledning" variant="secondary">Ledning</LinkButton>
            <LinkButton href="/operations/notiser" variant="secondary">Notiser</LinkButton>
          </div>
        }
      />
      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold tracking-tight">Kräver åtgärd</h2>
        {tasks.length === 0 && buckets.week === 0 ? (
          <ActionCard href="/operations/pipeline" label="Allt i fas" value="0" tone="green" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((t) => (
              <ActionCard key={t.kind} href={t.href} label={t.label} value={t.count} tone={t.severity} />
            ))}
            {buckets.week > 0 ? (
              <ActionCard href="/operations/leads" label="Repeat leads är aktuella denna vecka" value={buckets.week} tone="green" />
            ) : null}
          </div>
        )}
      </section>
      <Panel title="Produktion denna vecka" padded={false}>
        {byDay.size === 0 ? (
          <div className="p-5">
            <EmptyState title="Ingen planerad produktion" body="När tryckjobb läggs i veckan syns enkelvägg, dubbelvägg och ECO här." />
          </div>
        ) : (
          <DataTable headers={[{ label: "Dag" }, { label: "Enkelvägg", align: "right" }, { label: "Dubbelvägg", align: "right" }, { label: "ECO", align: "right" }]}>
            {[...byDay.entries()].map(([day, r]) => (
              <DataRow key={day}>
                <td className="px-5 py-2.5 capitalize">{day}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{r.ev || "–"}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{r.dv || "–"}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{r.eco || "–"}</td>
              </DataRow>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
