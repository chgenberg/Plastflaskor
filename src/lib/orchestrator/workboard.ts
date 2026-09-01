import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  isWorkboardCard,
  type CardStatus,
  type Workboard,
  type WorkboardCard,
} from "@/lib/orchestrator/workboard-types";

export type {
  CardSource,
  CardStatus,
  Workboard,
  WorkboardCard,
} from "@/lib/orchestrator/workboard-types";
export { CARD_STATUSES, isCardStatus, isWorkboardCard } from "@/lib/orchestrator/workboard-types";

const WORKBOARD_REL = "src/lib/orchestrator/workboard.json";

export function workboardPath(root = process.cwd()): string {
  return path.join(root, WORKBOARD_REL);
}

const EMPTY: Workboard = { updatedAt: new Date(0).toISOString(), cards: [] };

export async function loadWorkboard(root = process.cwd()): Promise<Workboard> {
  try {
    const raw = await readFile(workboardPath(root), "utf8");
    const parsed = JSON.parse(raw) as Workboard;
    if (!parsed || !Array.isArray(parsed.cards)) return EMPTY;
    return {
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : EMPTY.updatedAt,
      cards: parsed.cards.filter(isWorkboardCard),
    };
  } catch {
    return EMPTY;
  }
}

export async function saveWorkboard(board: Workboard, root = process.cwd()): Promise<void> {
  const next: Workboard = {
    updatedAt: new Date().toISOString(),
    cards: board.cards,
  };
  try {
    await writeFile(workboardPath(root), `${JSON.stringify(next, null, 2)}\n`, "utf8");
  } catch {
    // Prod filesystem is often read-only. Prisma is truth there.
  }
}

export function moveCard(board: Workboard, id: string, status: CardStatus): Workboard {
  const now = new Date().toISOString();
  return {
    updatedAt: now,
    cards: board.cards.map((c) => (c.id === id ? { ...c, status, updatedAt: now } : c)),
  };
}

export function upsertCard(board: Workboard, card: WorkboardCard): Workboard {
  const now = new Date().toISOString();
  const idx = board.cards.findIndex((c) => c.id === card.id);
  const next = { ...card, updatedAt: now };
  if (idx === -1) {
    return { updatedAt: now, cards: [next, ...board.cards] };
  }
  const cards = board.cards.slice();
  cards[idx] = { ...cards[idx], ...next };
  return { updatedAt: now, cards };
}

/** DB wins on the same card id (key). */
export function mergeCards(file: WorkboardCard[], db: WorkboardCard[]): WorkboardCard[] {
  const byId = new Map<string, WorkboardCard>();
  for (const c of file) byId.set(c.id, c);
  for (const c of db) byId.set(c.id, c);
  return [...byId.values()].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}
