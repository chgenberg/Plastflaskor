import { AgentBoard } from "@/ui/ops/AgentBoard";
import { AgentMap } from "@/ui/ops/AgentMap";
import { AgentRefresh } from "@/ui/ops/AgentRefresh";
import { PageHeader } from "@/ui/shell/primitives";
import { groupOpenCards } from "@/lib/orchestrator/groups";
import { orchestratorSnapshot, runAquaHeartbeatIfStale } from "@/server/orchestrator";

export const dynamic = "force-dynamic";

export default async function AgentenPage() {
  const tick = await runAquaHeartbeatIfStale();
  const snap = await orchestratorSnapshot();
  const groups = groupOpenCards(snap.open);

  return (
    <div className="space-y-4">
      <AgentRefresh />
      <PageHeader
        title="Agenten"
        subtitle="Order → Etiketter (ETD/POD) · Bottler (accept/POD/FRAKT) · Kund (Korr/POA/OB) → Frakt → Faktura. Fortnox är mock. Hon fakturerar inte."
      />
      <div className="av-card p-5">
        <p className="av-label">Senaste puls</p>
        <p className="mt-1 text-sm">{tick.summary}</p>
        {snap.run?.endedAt ? (
          <p className="mt-1 text-[12px] text-[var(--av-text-muted)]">
            {new Date(snap.run.endedAt).toLocaleString("sv-SE")}
          </p>
        ) : null}
      </div>
      <AgentMap pulse={snap.pulse} />
      <AgentBoard groups={groups} />
    </div>
  );
}
