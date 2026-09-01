import type { DomainId } from "@/lib/orchestrator/graph";
import { isGate, type Gate } from "@/lib/orchestrator/approvals";

export type CardStatus = "inbox" | "ready" | "doing" | "blocked" | "done";

export const CARD_STATUSES: CardStatus[] = ["inbox", "ready", "doing", "blocked", "done"];

export function isCardStatus(value: string): value is CardStatus {
  return (CARD_STATUSES as string[]).includes(value);
}

export type CardSource = "cursor" | "heartbeat" | "admin";

export type WorkboardCard = {
  id: string;
  title: string;
  body: string;
  status: CardStatus;
  domainId: DomainId;
  playbook: string;
  files: string[];
  gate: Gate;
  source: CardSource;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
};

export type Workboard = {
  updatedAt: string;
  cards: WorkboardCard[];
};

export function isWorkboardCard(value: unknown): value is WorkboardCard {
  if (!value || typeof value !== "object") return false;
  const c = value as WorkboardCard;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    isCardStatus(c.status) &&
    isGate(c.gate) &&
    typeof c.domainId === "string"
  );
}
