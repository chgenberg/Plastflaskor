import { ORDER_STEP_LABELS, ORDER_STEPS, type OrderStatusCode } from "./enums";

const OWNERS: Record<string, string> = {
  SUBMITTED: "Aqua — ta emot ordern",
  AQUA_REVIEW: "Aqua — granska order och artwork",
  ARTWORK_AQUA_REVIEW: "Aqua — skicka korrektur",
  ARTWORK_CUSTOMER_APPROVAL: "Köpare — godkänn korrektur",
  CONFIRMED: "Aqua — skicka till tryckeri",
  IN_PRODUCTION: "Tryckeri",
  READY_TO_SHIP: "Aqua — skapa fraktsedel",
  SHIPPED: "Transportör",
  DELIVERED: "Aqua — fakturera",
  READY_TO_INVOICE: "Aqua ekonomi",
  INVOICED: "Köpare — betalning",
  PAID: "Klar",
};

export function orderBrief(status: string, requestedDate?: string | null) {
  const idx = ORDER_STEPS.indexOf(status as OrderStatusCode);
  const next = idx >= 0 ? ORDER_STEPS[idx + 1] : undefined;
  const overdue = Boolean(
    requestedDate &&
      new Date(requestedDate) < new Date() &&
      !["DELIVERED", "INVOICED", "PAID", "READY_TO_INVOICE"].includes(status),
  );
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

export function addLeadTimeDays(days: number, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export type BuyerTimelineStep = { id: string; label: string; done: boolean; current: boolean };

export function buyerTimeline(status: string): BuyerTimelineStep[] {
  const confirmed = ["CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "READY_TO_INVOICE", "INVOICED", "PAID"].includes(status);
  const printing = ["IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "READY_TO_INVOICE", "INVOICED", "PAID"].includes(status);
  const packing = ["READY_TO_SHIP", "SHIPPED", "DELIVERED", "READY_TO_INVOICE", "INVOICED", "PAID"].includes(status);
  const shipped = ["SHIPPED", "DELIVERED", "READY_TO_INVOICE", "INVOICED", "PAID"].includes(status);
  const delivered = ["DELIVERED", "READY_TO_INVOICE", "INVOICED", "PAID"].includes(status);
  const inArtwork = ["ARTWORK_AQUA_REVIEW", "ARTWORK_CUSTOMER_APPROVAL"].includes(status);

  const steps: BuyerTimelineStep[] = [
    { id: "received", label: "Order mottagen", done: true, current: false },
    { id: "artwork", label: "Korrektur", done: confirmed, current: inArtwork },
    { id: "confirmed", label: "Order bekräftad", done: confirmed, current: false },
    { id: "print", label: "Produktion", done: printing, current: status === "IN_PRODUCTION" },
    { id: "pack", label: "Förbereds för leverans", done: packing, current: status === "READY_TO_SHIP" },
    { id: "shipped", label: "Skickad", done: shipped, current: status === "SHIPPED" },
    { id: "delivered", label: "Levererad", done: delivered, current: delivered && status === "DELIVERED" },
  ];
  if (!steps.some((s) => s.current)) {
    const next = steps.find((s) => !s.done);
    if (next) next.current = true;
    else steps[steps.length - 1].current = true;
  }
  return steps;
}

const SHIPMENT_TRACK_STEPS = [
  { id: "CREATED", label: "Skapad" },
  { id: "PICKED_UP", label: "Hämtad" },
  { id: "IN_TRANSIT", label: "Under transport" },
  { id: "DELIVERED", label: "Levererad" },
] as const;

export function shipmentTrackingSteps(status: string): BuyerTimelineStep[] {
  const ids = SHIPMENT_TRACK_STEPS.map((s) => s.id);
  const idx = Math.max(0, ids.indexOf(status as (typeof ids)[number]));
  return SHIPMENT_TRACK_STEPS.map((s, i) => ({
    id: s.id,
    label: s.label,
    done: i < idx || (s.id === "DELIVERED" && status === "DELIVERED"),
    current: i === idx,
  }));
}

export function buyerNextAction(
  orders: { orderNo: string; currentStatus: string; artworkApprovals?: { kind: string }[] }[],
) {
  const proofOrders = orders.filter((o) => o.currentStatus === "ARTWORK_CUSTOMER_APPROVAL");
  const pendingProof = proofOrders.find((o) => !(o.artworkApprovals ?? []).some((a) => a.kind === "CUSTOMER_FINAL"));
  if (pendingProof) {
    return {
      title: "Godkänn korrektur",
      body: `${pendingProof.orderNo} väntar på ert godkännande.`,
      hrefSuffix: `/ordrar/${pendingProof.orderNo}`,
      cta: "Öppna korrektur",
    };
  }
  const waitingOb = proofOrders[0];
  if (waitingOb) {
    return {
      title: "Väntar på orderbekräftelse",
      body: `${waitingOb.orderNo} — AquaVisibility skickar slutlig orderbekräftelse.`,
      hrefSuffix: `/ordrar/${waitingOb.orderNo}`,
      cta: "Öppna order",
    };
  }
  const shipped = orders.find((o) => o.currentStatus === "SHIPPED");
  if (shipped) {
    return { title: "Följ leverans", body: `${shipped.orderNo} är på väg.`, hrefSuffix: `/ordrar/${shipped.orderNo}`, cta: "Öppna order" };
  }
  if (orders.length === 0) {
    return { title: "Skapa er första order", body: "Beställ pappersmuggar med artwork och lock.", hrefSuffix: "/ordrar/ny", cta: "Ny order" };
  }
  return { title: "Ny order", body: "Beställ samma artwork igen eller skapa en ny mugg.", hrefSuffix: "/ordrar/ny", cta: "Ny order" };
}
