import { listAllOrders } from "@/server/services/order.service";
import { activateDueLeads, listLeads } from "@/server/services/lead.service";
import { listUnreadQuoteInquiries } from "@/server/services/notify";
import { exceptionSummary, exceptionsFor } from "@/domain/exceptions";
import { ActionCard, LinkButton, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function OpsHome() {
  const orders = await listAllOrders();
  await activateDueLeads();
  const { buckets } = await listLeads();
  const quotes = await listUnreadQuoteInquiries();
  const tasks = exceptionSummary(exceptionsFor(orders));

  return (
    <div className="space-y-7">
      <PageHeader
        title="Vad behöver du göra nu?"
        subtitle="Kräver åtgärd"
        action={<LinkButton href="/operations/pipeline">Öppna pipeline</LinkButton>}
      />
      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold tracking-tight">Kräver åtgärd</h2>
        {tasks.length === 0 && buckets.week === 0 && quotes.length === 0 ? (
          <ActionCard href="/operations/pipeline" label="Allt i fas" value="0" tone="green" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((t) => (
              <ActionCard key={t.kind} href={t.href} label={t.label} value={t.count} tone={t.severity} />
            ))}
            {quotes.length > 0 ? (
              <ActionCard href="/operations#offerter" label="Nya offertförfrågningar" value={quotes.length} tone="yellow" />
            ) : null}
            {buckets.week > 0 ? (
              <ActionCard href="/operations/leads" label="Repeat leads är aktuella denna vecka" value={buckets.week} tone="green" />
            ) : null}
          </div>
        )}
      </section>
      {quotes.length > 0 ? (
        <Panel title="Offertförfrågningar">
          <ul className="space-y-3 text-sm" id="offerter">
            {quotes.map((q) => (
              <li key={q.id}>
                <p className="font-medium">{q.title}</p>
                <p className="mt-0.5 text-[var(--av-text-muted)]">{q.body}</p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
