import { ORDER_STEP_LABELS, ORDER_STEPS, type OrderStatusCode } from "./enums";

const OWNERS: Record<string, string> = {
  SUBMITTED: "Aqua — ta emot ordern",
  AQUA_REVIEW: "Aqua — granska order och artwork",
  ARTWORK_AQUA_REVIEW: "Aqua — skicka korrektur",
  ARTWORK_CUSTOMER_APPROVAL: "Kund — godkänn korrektur",
  CONFIRMED: "Aqua — skicka till etikettproducent",
  LABEL_PRODUCTION: "Etikettproducent",
  LABELS_DISPATCHED: "Etiketter på väg till bottler",
  LABELS_RECEIVED: "Bottler — planera produktion",
  PRODUCTION_SCHEDULED: "Bottler",
  IN_PRODUCTION: "Bottler",
  READY_TO_SHIP: "Aqua — skapa fraktsedel",
  SHIPPED: "Transportör",
  DELIVERED: "Aqua — fakturera",
  READY_TO_INVOICE: "Aqua ekonomi",
  INVOICED: "Kund — betalning",
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

export type CustomerAction = "artwork" | "proof" | "invoice";

export type ArtworkRejectFacts = {
  artworkApprovals?: { kind: string; createdAt?: Date | string }[] | null;
  artworkVersions?: { createdAt?: Date | string }[] | null;
};

/** Senaste AQUA_REJECTED utan nyare fil — kunden ska skicka artwork igen. */
export function needsNewArtworkAfterReject(o: ArtworkRejectFacts): boolean {
  const rejected = (o.artworkApprovals ?? []).filter((a) => a.kind === "AQUA_REJECTED");
  if (!rejected.length) return false;
  const latest = rejected.reduce((acc, a) => {
    if (!a.createdAt) return acc;
    if (!acc.createdAt) return a;
    return new Date(a.createdAt) > new Date(acc.createdAt) ? a : acc;
  });
  if (!latest.createdAt) return true;
  const at = new Date(latest.createdAt);
  return !(o.artworkVersions ?? []).some((v) => v.createdAt && new Date(v.createdAt) > at);
}

export function customerActionFor(o: {
  currentStatus: string;
  lockedAt: Date | null;
  designs: { files: { id: string }[] }[];
  artworkApprovals?: { kind: string; createdAt?: Date | string }[];
  artworkVersions?: { createdAt?: Date | string }[];
  invoice?: { status: string } | null;
}): CustomerAction | null {
  const hasArtwork = o.designs.some((d) => d.files.length > 0);
  if (!o.lockedAt && needsNewArtworkAfterReject(o) && o.currentStatus !== "ARTWORK_CUSTOMER_APPROVAL") return "artwork";
  if (!o.lockedAt && !hasArtwork && o.currentStatus !== "ARTWORK_CUSTOMER_APPROVAL") return "artwork";
  if (o.currentStatus === "ARTWORK_CUSTOMER_APPROVAL" && !(o.artworkApprovals ?? []).some((a) => a.kind === "CUSTOMER_FINAL")) {
    return "proof";
  }
  if (o.currentStatus === "INVOICED" && o.invoice?.status !== "PAID") return "invoice";
  return null;
}

export function buyerTimeline(status: string, action?: CustomerAction | null): BuyerTimelineStep[] {
  const afterConfirm = [
    "CONFIRMED",
    "LABEL_PRODUCTION",
    "LABELS_DISPATCHED",
    "LABELS_RECEIVED",
    "PRODUCTION_SCHEDULED",
    "IN_PRODUCTION",
    "READY_TO_SHIP",
    "SHIPPED",
    "DELIVERED",
    "READY_TO_INVOICE",
    "INVOICED",
    "PAID",
  ].includes(status);
  const labelsDone = ["LABELS_RECEIVED", "PRODUCTION_SCHEDULED", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "READY_TO_INVOICE", "INVOICED", "PAID"].includes(status);
  const printing = ["IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "READY_TO_INVOICE", "INVOICED", "PAID"].includes(status);
  const shipped = ["SHIPPED", "DELIVERED", "READY_TO_INVOICE", "INVOICED", "PAID"].includes(status);
  const delivered = ["DELIVERED", "READY_TO_INVOICE", "INVOICED", "PAID"].includes(status);
  const inLabels = ["LABEL_PRODUCTION", "LABELS_DISPATCHED"].includes(status);
  const artworkDone = afterConfirm || ["ARTWORK_AQUA_REVIEW", "ARTWORK_CUSTOMER_APPROVAL"].includes(status);
  const proofDone = afterConfirm || (status === "ARTWORK_CUSTOMER_APPROVAL" && action !== "proof");

  const steps: BuyerTimelineStep[] = [
    { id: "received", label: "Beställd", done: true, current: false },
    { id: "artwork", label: "Artwork", done: artworkDone && action !== "artwork", current: action === "artwork" },
    { id: "proof", label: "Korr", done: proofDone && action !== "proof", current: action === "proof" },
    { id: "confirmed", label: "OB", done: afterConfirm, current: status === "CONFIRMED" },
    { id: "labels", label: "Etikett", done: labelsDone, current: inLabels },
    { id: "print", label: "Produktion", done: printing, current: status === "IN_PRODUCTION" || status === "LABELS_RECEIVED" || status === "PRODUCTION_SCHEDULED" },
    { id: "shipped", label: "Skickad", done: shipped, current: status === "SHIPPED" || status === "READY_TO_SHIP" },
    { id: "delivered", label: "Levererad", done: delivered, current: delivered && (status === "DELIVERED" || status === "READY_TO_INVOICE" || status === "INVOICED" || status === "PAID") },
  ];
  if (action === "artwork") {
    steps.forEach((s) => {
      s.current = s.id === "artwork";
    });
  } else if (action === "proof") {
    steps.forEach((s) => {
      s.current = s.id === "proof";
    });
  } else if (!steps.some((s) => s.current)) {
    const next = steps.find((s) => !s.done);
    if (next) next.current = true;
    else steps[steps.length - 1]!.current = true;
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
  orders: {
    orderNo: string;
    currentStatus: string;
    lockedAt?: Date | null;
    designs?: { files: { id: string }[] }[];
    artworkApprovals?: { kind: string; createdAt?: Date | string }[];
    artworkVersions?: { createdAt?: Date | string }[];
    invoice?: { status: string } | null;
  }[],
) {
  const asAction = (o: (typeof orders)[number]) =>
    customerActionFor({
      currentStatus: o.currentStatus,
      lockedAt: o.lockedAt ?? null,
      designs: o.designs ?? [],
      artworkApprovals: o.artworkApprovals,
      artworkVersions: o.artworkVersions,
      invoice: o.invoice,
    });
  const proof = orders.find((o) => asAction(o) === "proof");
  if (proof) {
    return {
      title: "Godkänn korrektur",
      body: `${proof.orderNo} väntar på ert godkännande.`,
      hrefSuffix: `/ordrar/${proof.orderNo}`,
      cta: "Öppna korrektur",
    };
  }
  const waitingOb = orders.find(
    (o) => o.currentStatus === "ARTWORK_CUSTOMER_APPROVAL" && (o.artworkApprovals ?? []).some((a) => a.kind === "CUSTOMER_FINAL"),
  );
  if (waitingOb) {
    return {
      title: "Väntar på orderbekräftelse",
      body: `${waitingOb.orderNo} — AquaVisibility skickar slutlig orderbekräftelse.`,
      hrefSuffix: `/ordrar/${waitingOb.orderNo}`,
      cta: "Öppna order",
    };
  }
  const artwork = orders.find((o) => asAction(o) === "artwork");
  if (artwork) {
    return {
      title: "Ladda upp artwork",
      body: `${artwork.orderNo} saknar artwork.`,
      hrefSuffix: `/ordrar/${artwork.orderNo}`,
      cta: "Öppna order",
    };
  }
  const shipped = orders.find((o) => o.currentStatus === "SHIPPED");
  if (shipped) {
    return { title: "Följ leverans", body: `${shipped.orderNo} är på väg.`, hrefSuffix: `/ordrar/${shipped.orderNo}`, cta: "Öppna order" };
  }
  if (orders.length === 0) {
    return { title: "Skapa er första order", body: "Beställ profilvatten med egen etikett och artwork.", hrefSuffix: "/ordrar/ny", cta: "Ny order" };
  }
  return { title: "Ny order", body: "Beställ samma artwork igen eller skapa en ny flaskorder.", hrefSuffix: "/ordrar/ny", cta: "Ny order" };
}
