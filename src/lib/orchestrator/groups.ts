import type { Gate } from "@/lib/orchestrator/approvals";
import type { WorkboardCard } from "@/lib/orchestrator/workboard-types";

export type CardGroup = {
  id: string;
  title: string;
  count: number;
  href: string;
  gate: Gate;
};

export function cardHref(card: WorkboardCard): string {
  const match = card.body.match(/Öppna (\S+)/);
  if (match?.[1]?.startsWith("/")) return match[1];
  if (card.id.startsWith("ex:invoice:")) return "/operations/ekonomi";
  if (card.id.startsWith("repeat-lead:")) return "/operations/leads";
  const order = card.id.split(":").at(-1);
  return order?.startsWith("AV") ? `/operations/ordrar/${order}` : "/operations";
}

export function cardKind(id: string): string {
  if (id.startsWith("ex:")) return id.split(":")[1] ?? "other";
  if (id.startsWith("repeat-lead:")) return "lead";
  return id;
}

export function groupOpenCards(cards: WorkboardCard[]): CardGroup[] {
  const map = new Map<string, CardGroup>();
  for (const card of cards) {
    if (card.status === "done") continue;
    const id = cardKind(card.id);
    const title = card.title.split(" · ")[0] || card.title;
    const prev = map.get(id);
    if (prev) prev.count += 1;
    else {
      map.set(id, {
        id,
        title,
        count: 1,
        href: cardHref(card),
        gate: card.gate,
      });
    }
  }
  return [...map.values()].sort((a, b) => {
    if (a.gate !== "none" && b.gate === "none") return -1;
    if (a.gate === "none" && b.gate !== "none") return 1;
    return b.count - a.count;
  });
}
