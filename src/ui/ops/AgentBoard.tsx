import { ActionCard } from "@/ui/shell/primitives";
import type { CardGroup } from "@/lib/orchestrator/groups";

function tone(group: CardGroup): "green" | "yellow" | "red" | "grey" {
  if (group.id === "labels_not_received") return "red";
  if (group.id === "lead") return "green";
  if (group.gate === "irreversible") return "yellow";
  return "yellow";
}

export function AgentBoard({ groups }: { groups: CardGroup[] }) {
  const locked = groups.filter((g) => g.gate !== "none");
  const rest = groups.filter((g) => g.gate === "none");

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold tracking-tight">Behöver ett beslut</h2>
        {locked.length === 0 ? (
          <p className="text-sm text-[var(--av-text-muted)]">Inget som kräver ja just nu.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((group) => (
              <div key={group.id} className="space-y-2">
                <ActionCard href={group.href} label={group.title} value={group.count} tone={tone(group)} />
                <p className="px-1 text-[12px] text-[var(--av-text-muted)]">
                  Agenten stannar här. Aqua gör det i systemet.
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold tracking-tight">På gång</h2>
        {rest.length === 0 ? (
          <p className="text-sm text-[var(--av-text-muted)]">Inga öppna kort.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((group) => (
              <ActionCard key={group.id} href={group.href} label={group.title} value={group.count} tone={tone(group)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
