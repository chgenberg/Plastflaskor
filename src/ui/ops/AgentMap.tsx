import { HOUSE_TAIL, HOUSE_TRACKS, NODE_BY_ID, type DomainId } from "@/lib/orchestrator/graph";

function Box({
  title,
  note,
  count,
  accent,
}: {
  title: string;
  note: string;
  count: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--av-radius-md)] border px-3 py-2 ${
        accent
          ? "border-[var(--av-accent)]/25 bg-[var(--av-accent-soft)]"
          : "border-[var(--av-border)] bg-[var(--av-surface)]"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-semibold tracking-tight">{title}</p>
        <p className="text-[15px] font-semibold tabular-nums">{count}</p>
      </div>
      <p className="mt-0.5 text-[11px] text-[var(--av-text-muted)]">{note}</p>
    </div>
  );
}

export function AgentMap({ pulse }: { pulse: Record<DomainId, number> }) {
  const order = NODE_BY_ID.order;
  const freight = NODE_BY_ID.freight;
  const money = NODE_BY_ID.money;

  return (
    <div className="space-y-3">
      <p className="av-label">Huset — samma som skissen</p>
      <Box title={order.label} note={order.blurb} count={pulse.order ?? 0} accent />
      <div className="grid gap-3 md:grid-cols-3">
        {HOUSE_TRACKS.map((track) => (
          <div key={track.id} className="space-y-1.5">
            <Box
              title={track.label}
              note={NODE_BY_ID[track.domainId].blurb}
              count={pulse[track.domainId] ?? 0}
              accent={(pulse[track.domainId] ?? 0) > 0}
            />
            {track.steps.map((step) => (
              <div key={step.id} className="av-row !min-h-0 py-1.5">
                <p className="text-[13px] font-semibold">{step.label}</p>
                <p className="min-w-0 flex-1 truncate text-[12px] text-[var(--av-text-secondary)]">{step.note}</p>
                <p className="tabular-nums text-[13px] font-medium">{pulse[step.domainId] ?? 0}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="grid gap-1.5 sm:grid-cols-3">
        {HOUSE_TAIL.map((step) => (
          <Box
            key={step.id}
            title={step.label}
            note={step.note}
            count={pulse[step.domainId] ?? 0}
            accent={step.domainId === "money"}
          />
        ))}
      </div>
      <p className="text-[12px] text-[var(--av-text-muted)]">
        {freight.label} leder till {money.label} via Fortnox-mock. Agenten fakturerar inte.
      </p>
    </div>
  );
}
