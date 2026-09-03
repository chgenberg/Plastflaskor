import { listAllOrders } from "@/server/services/order.service";
import { activateDueLeads, listLeads } from "@/server/services/lead.service";
import { listBottlerInvoices } from "@/server/services/bottlerInvoice.service";
import { listLabelDispatches } from "@/server/services/labelDispatch.service";
import { countUnverifiedCustomers } from "@/server/services/customer.service";
import { exceptionsFor } from "@/domain/exceptions";
import { ORDER_LIST_LANES } from "@/domain/enums";
import { Reveal } from "@/ui/motion/Reveal";
import { OrderResultsTable } from "@/ui/ops/OrderResultsTable";
import { DashPage, KpiCard, KpiStrip, LinkButton, NeedsAttention, PageHeader, QuickLinks } from "@/ui/shell/primitives";
import { loadOrchestratorBoard, runAquaHeartbeatIfStale } from "@/server/orchestrator";

const PRODUCTION = new Set<string>(ORDER_LIST_LANES.find((l) => l.id === "production")?.statuses ?? []);

export default async function OpsHome() {
  const orders = await listAllOrders();
  await activateDueLeads();
  const { buckets } = await listLeads();
  const newCustomers = await countUnverifiedCustomers();
  const exceptions = exceptionsFor(orders);
  const [labelReports, bottlerReports] = await Promise.all([listLabelDispatches(), listBottlerInvoices()]);
  const unverifiedOrders = orders.filter((o) => !o.customer.verifiedAt).length;
  const kpi = {
    confirm: orders.filter((o) => o.currentStatus === "SUBMITTED" || o.currentStatus === "AQUA_REVIEW").length,
    newCustomers,
    inProduction: orders.filter((o) => PRODUCTION.has(o.currentStatus)).length,
    toInvoice: orders.filter((o) => o.currentStatus === "DELIVERED" || o.currentStatus === "READY_TO_INVOICE").length,
  };
  let agentOpen = 0;
  try {
    await runAquaHeartbeatIfStale();
    agentOpen = (await loadOrchestratorBoard()).filter((c) => c.status !== "done").length;
  } catch {
    agentOpen = 0;
  }

  const attention = [
    newCustomers > 0
      ? {
          key: "new-customers",
          href: "/operations/kunder?filter=ny",
          label: `${newCustomers} nya kunder att verifiera`,
        }
      : null,
    unverifiedOrders > 0
      ? {
          key: "unverified-orders",
          href: "/operations/ordrar?alert=review&kund=ny",
          label: `${unverifiedOrders} ordrar från overifierad kund`,
        }
      : null,
    ...exceptions.slice(0, 5).map((e) => ({
      key: `${e.kind}-${e.orderNo}`,
      href: `/operations/ordrar/${e.orderNo}`,
      label: `${e.orderNo} · ${e.label}`,
    })),
    buckets.week > 0
      ? { key: "leads", href: "/operations/leads", label: `${buckets.week} repeat leads denna vecka` }
      : null,
  ].filter((row): row is { key: string; href: string; label: string } => Boolean(row));

  return (
    <DashPage>
      <PageHeader
        title="Vad behöver du göra nu?"
        subtitle="Master Dashboard — kräver åtgärd."
        action={
          <LinkButton href="/operations/pipeline" size="sm">
            Öppna pipeline
          </LinkButton>
        }
      />
      <Reveal>
        <KpiStrip>
          <KpiCard href="/operations/ordrar?alert=review" label="Att bekräfta" value={kpi.confirm} />
          <KpiCard href="/operations/kunder?filter=ny" label="Nya kunder" value={kpi.newCustomers} />
          <KpiCard href="/operations/produktion" label="I produktion" value={kpi.inProduction} />
          <KpiCard href="/operations/ekonomi" label="Att fakturera" value={kpi.toInvoice} />
        </KpiStrip>
      </Reveal>
      <NeedsAttention items={attention} />
      <section className="space-y-3">
        <h2 className="av-section-title">Senaste ordrar</h2>
        <OrderResultsTable orders={orders.slice(0, 10)} />
      </section>
      <QuickLinks
        links={[
          { href: "/operations/ordrar", label: "Ordermottagning" },
          { href: "/operations/kunder", label: "Kunder" },
          { href: "/operations/agenten", label: "Agenten" },
        ]}
      />
      <p className="text-[13px] text-[var(--av-text-muted)]">
        Agenten bevakar samma kö.
        {agentOpen > 0 ? ` ${agentOpen} öppna kort.` : ""}
        {labelReports.length + bottlerReports.length > 0 ? ` Leverantörsunderlag ${labelReports.length + bottlerReports.length}.` : ""}
      </p>
    </DashPage>
  );
}
