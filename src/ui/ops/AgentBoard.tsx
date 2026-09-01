import { ActionCard, ActionList, SectionTitle } from "@/ui/shell/primitives";
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
      <section className="space-y-2">
        <SectionTitle>OB / Faktura — stannar</SectionTitle>
        {locked.length === 0 ? (
          <p className="text-[13px] text-[var(--av-text-muted)]">Inget som kräver ja just nu.</p>
        ) : (
          <ActionList>
            {locked.map((group) => (
              <ActionCard
                key={group.id}
                href={group.href}
                label={group.title}
                value={group.count}
                tone={tone(group)}
                detail="Agenten stannar här. Aqua gör det i systemet."
              />
            ))}
          </ActionList>
        )}
      </section>
      <section className="space-y-2">
        <SectionTitle>ETD · POD · Korr · POA</SectionTitle>
        {rest.length === 0 ? (
          <p className="text-[13px] text-[var(--av-text-muted)]">Inga öppna kort.</p>
        ) : (
          <ActionList>
            {rest.map((group) => (
              <ActionCard key={group.id} href={group.href} label={group.title} value={group.count} tone={tone(group)} />
            ))}
          </ActionList>
        )}
      </section>
    </div>
  );
}
