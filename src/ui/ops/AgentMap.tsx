import { NODE_BY_ID, type DomainId } from "@/lib/orchestrator/graph";

const SURFACES: { id: DomainId; note: string }[] = [
  { id: "customer", note: "Korrektur och tracking." },
  { id: "operations", note: "Det som kräver Aquas nästa steg." },
  { id: "labels", note: "Ingen pris- eller fakturainformation." },
  { id: "bottler", note: "Samma flaska som på OB." },
  { id: "money", note: "Agenten trycker aldrig Fakturera." },
];

export function AgentMap({ pulse }: { pulse: Record<DomainId, number> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-5">
      {SURFACES.map(({ id, note }) => {
        const node = NODE_BY_ID[id];
        const count = pulse[id] ?? 0;
        return (
          <div key={id} className="av-card p-4">
            <p className="av-label">{node.label}</p>
            <p className="mt-2 text-[28px] font-semibold tabular-nums tracking-tight">{count}</p>
            <p className="mt-1 text-[12px] text-[var(--av-text-muted)]">{note}</p>
          </div>
        );
      })}
    </div>
  );
}
