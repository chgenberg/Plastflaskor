import { EXCEPTION_SEVERITY, type Exception, type ExceptionKind } from "@/domain/exceptions";
import { emailPausedFromEnv } from "@/lib/orchestrator/approvals";
import type { Seed } from "@/lib/orchestrator/heartbeat";
import type { DomainId } from "@/lib/orchestrator/graph";
import type { Gate } from "@/lib/orchestrator/approvals";

/** Samma slags glapp som dashboarden räknar. */
export const PULSE_KINDS = Object.keys(EXCEPTION_SEVERITY) as ExceptionKind[];

const DOMAIN_FOR_KIND: Record<string, DomainId> = {
  review: "order",
  artwork_aqua: "artwork",
  artwork_customer: "customer",
  overdue_proof: "customer",
  deadline_unaccepted: "labels",
  deadline_issue: "labels",
  label_deadline: "labels",
  labels_not_received: "bottler",
  mark_shipped: "bottler",
  invoice: "money",
  ready_date: "bottler",
  ready_vs_requirement: "bottler",
  deadline_tomorrow: "labels",
  waybill: "freight",
  delivery: "freight",
  overdue: "order",
  lead: "order",
};

export function gateForKind(kind: ExceptionKind): Gate {
  if (kind === "invoice") return "irreversible";
  return "none";
}

export function seedFromException(item: Exception): Seed {
  return {
    key: `ex:${item.kind}:${item.orderNo}`,
    title: `${item.label} · ${item.orderNo}`,
    body: `Agenten såg samma glapp som dashboarden. Öppna ${item.href}`,
    domainId: DOMAIN_FOR_KIND[item.kind] ?? "operations",
    gate: gateForKind(item.kind),
    files: ["src/domain/exceptions.ts", "src/app/(operations)/operations/page.tsx"],
    playbook:
      item.kind === "invoice"
        ? "invoice"
        : item.kind.startsWith("artwork") || item.kind === "overdue_proof"
          ? "artwork"
          : item.kind === "review"
            ? "new-order"
            : item.kind === "waybill" || item.kind === "delivery"
              ? "invoice"
              : "produce",
  };
}

export function emailPausedSeed(): Seed | null {
  if (!emailPausedFromEnv()) return null;
  return {
    key: "email-paused",
    title: "Mejl är pausade",
    body: "EMAIL_PAUSED är på. Agenten skickar inget. Lyft flaggan manuellt.",
    domainId: "email",
    gate: "email",
    files: ["src/server/services/notify.ts"],
    playbook: "",
  };
}

export function leadSeed(id: string, title: string, body: string): Seed {
  return {
    key: `repeat-lead:${id}`,
    title,
    body,
    domainId: "order",
    gate: "none",
    files: ["src/server/services/lead.service.ts"],
    playbook: "new-order",
  };
}
