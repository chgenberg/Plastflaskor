import { ORDER_STEP_LABELS, ORDER_STEPS, type OrderStatusCode } from "./enums";

const OWNERS: Record<string, string> = {
  ORDER_RECEIVED: "Återförsäljare / kund — ladda upp artwork",
  ARTWORK_UPLOADED: "Aqua — godkänn korrektur",
  ARTWORK_APPROVED: "Aqua — beställ etiketter",
  LABELS_ORDERED: "Etikettleverantör",
  LABELS_PRINTED: "Aqua — skicka till fabrik",
  LABELS_SHIPPED_TO_FACTORY: "Transportör",
  LABELS_RECEIVED_BY_FACTORY: "Fabrik — planera",
  PRODUCTION_PLANNED: "Fabrik",
  PRODUCTION_STARTED: "Fabrik",
  BOTTLES_FILLED: "Fabrik",
  LABELS_APPLIED: "Fabrik",
  PRODUCTION_DONE: "Fabrik — fraktsedel",
  WAYBILL_CREATED: "Fabrik — skicka",
  SHIPPED_TO_END_CUSTOMER: "Transportör",
  DELIVERED: "Aqua — fakturera",
  READY_TO_INVOICE: "Aqua ekonomi",
  INVOICED: "Kund — betalning",
  PAID: "Klar",
};

export function orderBrief(status: string, requestedDate?: string | null) {
  const idx = ORDER_STEPS.indexOf(status as OrderStatusCode);
  const next = idx >= 0 ? ORDER_STEPS[idx + 1] : undefined;
  const overdue = Boolean(requestedDate && new Date(requestedDate) < new Date() && !["DELIVERED", "INVOICED", "PAID"].includes(status));
  return {
    now: ORDER_STEP_LABELS[status as OrderStatusCode] ?? status,
    must: next ? ORDER_STEP_LABELS[next] : "Inget mer att göra",
    waiting: OWNERS[status] ?? "Aqua Visibility",
    owner: OWNERS[status] ?? "Aqua Visibility",
    when: requestedDate ?? "Inget leveransdatum satt",
    overdue,
    nextStatus: next,
  };
}

export function isOverdue(status: string, requestedDate?: string | null) {
  return orderBrief(status, requestedDate).overdue;
}
