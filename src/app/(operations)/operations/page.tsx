import { listAllOrders } from "@/server/services/order.service";
import { activateDueLeads, listLeads } from "@/server/services/lead.service";
import { listBottlerInvoices } from "@/server/services/bottlerInvoice.service";
import { listLabelDispatches } from "@/server/services/labelDispatch.service";
import { exceptionSummary, exceptionsFor } from "@/domain/exceptions";
import { ActionCard, ActionList, DashPage, KpiCard, KpiStrip, LinkButton, PageHeader, SectionTitle } from "@/ui/shell/primitives";
import { loadOrchestratorBoard, runAquaHeartbeatIfStale } from "@/server/orchestrator";

export default async function OpsHome() {
  const orders = await listAllOrders();
  await activateDueLeads();
  const { buckets } = await listLeads();
  const tasks = exceptionSummary(exceptionsFor(orders));
  const [labelReports, bottlerReports] = await Promise.all([listLabelDispatches(), listBottlerInvoices()]);
  const house = {
    labels: orders.filter((o) => o.currentStatus === "LABEL_PRODUCTION").length,
    bottler: orders.filter((o) =>
      ["LABELS_DISPATCHED", "LABELS_RECEIVED", "PRODUCTION_SCHEDULED", "IN_PRODUCTION", "READY_TO_SHIP"].includes(
        o.currentStatus,
      ),
    ).length,
    freight: orders.filter((o) => o.currentStatus === "READY_TO_SHIP" || o.currentStatus === "SHIPPED").length,
    invoice: orders.filter((o) => o.currentStatus === "DELIVERED" || o.currentStatus === "READY_TO_INVOICE").length,
  };
  let agentOpen = 0;
  try {
    await runAquaHeartbeatIfStale();
    agentOpen = (await loadOrchestratorBoard()).filter((c) => c.status !== "done").length;
  } catch {
    agentOpen = 0;
  }

  return (
    <DashPage>
      <PageHeader
        title="Vad behöver du göra nu?"
        subtitle="Master Dashboard — kräver åtgärd."
        action={<LinkButton href="/operations/pipeline">Öppna pipeline</LinkButton>}
      />
      <KpiStrip>
        <KpiCard href="/operations/ordrar?phase=labels" label="Etiketter" value={house.labels} />
        <KpiCard href="/operations/produktion" label="Bottler" value={house.bottler} />
        <KpiCard href="/operations/frakt" label="Frakt" value={house.freight} />
        <KpiCard href="/operations/ekonomi" label="Faktura" value={house.invoice} />
      </KpiStrip>
      <p className="text-[13px] text-[var(--av-text-muted)]">
        Agenten bevakar samma kö.{" "}
        <a href="/operations/agenten" className="text-[var(--av-text)] hover:text-[var(--av-accent)]">
          {agentOpen > 0 ? `${agentOpen} öppna kort` : "Öppna agenten"}
        </a>
        {labelReports.length + bottlerReports.length > 0 ? (
          <>
            {" · "}
            <a href="/operations/dokument" className="text-[var(--av-text)] hover:text-[var(--av-accent)]">
              Leverantörsunderlag ({labelReports.length + bottlerReports.length})
            </a>
          </>
        ) : null}
      </p>
      <section className="space-y-2">
        <SectionTitle>Kräver åtgärd</SectionTitle>
        <ActionList>
          {tasks.length === 0 && buckets.week === 0 ? (
            <ActionCard href="/operations/pipeline" label="Allt i fas" value="0" tone="green" />
          ) : (
            <>
              {tasks.map((t) => (
                <ActionCard key={t.kind} href={t.href} label={t.label} value={t.count} tone={t.severity} />
              ))}
              {buckets.week > 0 ? (
                <ActionCard href="/operations/leads" label="Repeat leads är aktuella denna vecka" value={buckets.week} tone="green" />
              ) : null}
            </>
          )}
        </ActionList>
      </section>
    </DashPage>
  );
}
