import { isOverdue } from "./orderBrief";

export type ExceptionKind =
  | "review"
  | "artwork_aqua"
  | "artwork_customer"
  | "deadline_tomorrow"
  | "deadline_unaccepted"
  | "deadline_issue"
  | "ready_date"
  | "ready_vs_requirement"
  | "waybill"
  | "mark_shipped"
  | "delivery"
  | "invoice"
  | "overdue"
  | "overdue_proof"
  | "lead";

export type AlertSeverity = "green" | "yellow" | "red" | "grey";

export type Exception = {
  kind: ExceptionKind;
  label: string;
  href: string;
  orderNo: string;
  severity: AlertSeverity;
};

export type OrderLike = {
  orderNo: string;
  currentStatus: string;
  source: string;
  requestedDate?: string | null;
  factoryDeadlineAccepted?: boolean | null;
  factoryIssueNote?: string | null;
  factoryReadyEstimate?: string | null;
  aquaApprovedDelivery?: string | null;
  deliveryRequirement?: string | null;
  shipments?: { waybillNo?: string | null }[] | null;
  invoice?: { status?: string } | null;
  artworkApprovals?: { kind: string; createdAt: Date | string }[] | null;
};

export const EXCEPTION_SEVERITY: Record<ExceptionKind, AlertSeverity> = {
  review: "yellow",
  artwork_aqua: "yellow",
  artwork_customer: "yellow",
  deadline_tomorrow: "yellow",
  deadline_unaccepted: "yellow",
  deadline_issue: "red",
  ready_date: "yellow",
  ready_vs_requirement: "red",
  waybill: "yellow",
  mark_shipped: "grey",
  delivery: "grey",
  invoice: "yellow",
  overdue: "red",
  overdue_proof: "red",
  lead: "green",
};

const OPEN = new Set(["DELIVERED", "READY_TO_INVOICE", "INVOICED", "PAID"]);

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function tomorrowYmd(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  return ymd(d);
}

function daysBetween(from: Date | string, to = new Date()) {
  const a = new Date(typeof from === "string" ? `${from}T12:00:00` : from);
  return (to.getTime() - a.getTime()) / 86_400_000;
}

function isOpen(status: string) {
  return !OPEN.has(status);
}

function hasWaybill(o: OrderLike) {
  return Boolean(o.shipments?.some((s) => s.waybillNo));
}

function latestProofAt(o: OrderLike) {
  const proofs = (o.artworkApprovals ?? []).filter((a) => a.kind === "AQUA_PROOF");
  if (!proofs.length) return null;
  return proofs.reduce((latest, a) => (new Date(a.createdAt) > new Date(latest.createdAt) ? a : latest)).createdAt;
}

const RULES: { kind: ExceptionKind; label: string; href: (o: OrderLike) => string; match: (o: OrderLike) => boolean }[] = [
  {
    kind: "review",
    label: "Nya ordrar behöver granskas",
    href: () => `/operations/ordrar?alert=review`,
    match: (o) => o.currentStatus === "SUBMITTED" || o.currentStatus === "AQUA_REVIEW",
  },
  {
    kind: "artwork_aqua",
    label: "Artwork behöver Aqua-godkännande",
    href: () => `/operations/ordrar?alert=artwork_aqua`,
    match: (o) => o.currentStatus === "ARTWORK_AQUA_REVIEW",
  },
  {
    kind: "artwork_customer",
    label: "Korrektur väntar på kund",
    href: () => `/operations/ordrar?alert=artwork_customer`,
    match: (o) => o.currentStatus === "ARTWORK_CUSTOMER_APPROVAL",
  },
  {
    kind: "deadline_tomorrow",
    label: "Deadline i morgon",
    href: () => `/operations/ordrar?alert=deadline_tomorrow`,
    match: (o) => isOpen(o.currentStatus) && o.requestedDate === tomorrowYmd(),
  },
  {
    kind: "deadline_unaccepted",
    label: "Deadline ej accepterad av tryckeri",
    href: () => `/operations/ordrar?alert=deadline_unaccepted`,
    match: (o) => o.currentStatus === "CONFIRMED" && o.factoryDeadlineAccepted === false && !o.factoryIssueNote,
  },
  {
    kind: "deadline_issue",
    label: "Tryckeri har flaggat deadline",
    href: () => `/operations/ordrar?alert=deadline_issue`,
    match: (o) => Boolean(o.factoryIssueNote) && !o.factoryDeadlineAccepted,
  },
  {
    kind: "ready_date",
    label: "Tryckeri-datum behöver godkännas",
    href: () => `/operations/ordrar?alert=ready_date`,
    match: (o) => Boolean(o.factoryReadyEstimate) && !o.aquaApprovedDelivery,
  },
  {
    kind: "ready_vs_requirement",
    label: "Tryckeridatum efter kundens krav",
    href: () => `/operations/ordrar?alert=ready_vs_requirement`,
    match: (o) => Boolean(o.factoryReadyEstimate && o.requestedDate && o.factoryReadyEstimate > o.requestedDate),
  },
  {
    kind: "waybill",
    label: "Fraktsedlar behöver skapas",
    href: () => `/operations/ordrar?alert=waybill`,
    match: (o) => o.currentStatus === "READY_TO_SHIP" && !hasWaybill(o),
  },
  {
    kind: "mark_shipped",
    label: "Markera skickad",
    href: () => `/operations/ordrar?alert=mark_shipped`,
    match: (o) => o.currentStatus === "READY_TO_SHIP" && hasWaybill(o),
  },
  {
    kind: "delivery",
    label: "Synka leverans",
    href: () => `/operations/ordrar?alert=delivery`,
    match: (o) => o.currentStatus === "SHIPPED",
  },
  {
    kind: "invoice",
    label: "Ordrar är redo att faktureras",
    href: () => `/operations/ekonomi`,
    match: (o) =>
      (o.currentStatus === "READY_TO_INVOICE" || o.currentStatus === "DELIVERED") &&
      (!o.invoice || o.invoice.status === "NOT_READY"),
  },
  {
    kind: "overdue",
    label: "Försenad mot leveransdatum",
    href: () => `/operations/ordrar?alert=overdue`,
    match: (o) => isOverdue(o.currentStatus, o.requestedDate),
  },
  {
    kind: "overdue_proof",
    label: "Korrektur försenat",
    href: () => `/operations/ordrar?alert=overdue_proof`,
    match: (o) => {
      if (o.currentStatus !== "ARTWORK_CUSTOMER_APPROVAL") return false;
      const sent = latestProofAt(o);
      if (sent) return daysBetween(sent) >= 3;
      if (o.requestedDate) return daysBetween(o.requestedDate) >= -5;
      return false;
    },
  },
];

export function exceptionsFor(orders: OrderLike[]): Exception[] {
  const out: Exception[] = [];
  for (const order of orders) {
    for (const rule of RULES) {
      if (rule.match(order)) {
        out.push({
          kind: rule.kind,
          label: rule.label,
          href: rule.href(order),
          orderNo: order.orderNo,
          severity: EXCEPTION_SEVERITY[rule.kind],
        });
      }
    }
  }
  return out;
}

export function exceptionSummary(items: Exception[]) {
  const map = new Map<ExceptionKind, { kind: ExceptionKind; label: string; href: string; count: number; severity: AlertSeverity }>();
  for (const item of items) {
    const prev = map.get(item.kind);
    if (prev) prev.count += 1;
    else map.set(item.kind, { kind: item.kind, label: item.label, href: item.href, count: 1, severity: item.severity });
  }
  const rank: Record<AlertSeverity, number> = { red: 0, yellow: 1, grey: 2, green: 3 };
  return [...map.values()].sort((a, b) => rank[a.severity] - rank[b.severity] || b.count - a.count);
}

export function ordersWithAlert<T extends OrderLike>(orders: T[], kind: ExceptionKind): T[] {
  return orders.filter((o) => exceptionsFor([o]).some((e) => e.kind === kind));
}

export function isExceptionKind(value: string | undefined): value is ExceptionKind {
  return Boolean(value && value in EXCEPTION_SEVERITY);
}
