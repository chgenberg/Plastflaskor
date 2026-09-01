export const ORDER_STEPS = [
  "SUBMITTED",
  "AQUA_REVIEW",
  "ARTWORK_AQUA_REVIEW",
  "ARTWORK_CUSTOMER_APPROVAL",
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
] as const;

export type OrderStatusCode = (typeof ORDER_STEPS)[number];

export const ORDER_STEP_LABELS: Record<OrderStatusCode, string> = {
  SUBMITTED: "Inskickad",
  AQUA_REVIEW: "Aqua granskar",
  ARTWORK_AQUA_REVIEW: "Korrektur hos Aqua",
  ARTWORK_CUSTOMER_APPROVAL: "Väntar på kundgodkännande",
  CONFIRMED: "Orderbekräftad",
  LABEL_PRODUCTION: "Etiketter produceras",
  LABELS_DISPATCHED: "Etiketter skickade",
  LABELS_RECEIVED: "Etiketter mottagna",
  PRODUCTION_SCHEDULED: "Produktion planerad",
  IN_PRODUCTION: "I produktion",
  READY_TO_SHIP: "Klar för leverans",
  SHIPPED: "Skickad",
  DELIVERED: "Levererad",
  READY_TO_INVOICE: "Redo för fakturering",
  INVOICED: "Fakturerad",
  PAID: "Betald",
};

export const BUYER_STATUS: Record<string, string> = {
  SUBMITTED: "Mottagen — väntar på Aqua",
  AQUA_REVIEW: "Mottagen — väntar på Aqua",
  ARTWORK_AQUA_REVIEW: "Mottagen — väntar på Aqua",
  ARTWORK_CUSTOMER_APPROVAL: "Väntar på ditt godkännande",
  CONFIRMED: "Bekräftad",
  LABEL_PRODUCTION: "Etiketter produceras",
  LABELS_DISPATCHED: "Etiketter produceras",
  LABELS_RECEIVED: "Produktion",
  PRODUCTION_SCHEDULED: "Produktion",
  IN_PRODUCTION: "Produktion",
  READY_TO_SHIP: "Förbereds för leverans",
  SHIPPED: "Skickad",
  DELIVERED: "Levererad",
  READY_TO_INVOICE: "Levererad",
  INVOICED: "Fakturerad",
  PAID: "Fakturerad",
};

export const PIPELINE_PHASES = [
  { id: "new", label: "Ny order", statuses: ["SUBMITTED"] },
  { id: "review", label: "Aqua granskar", statuses: ["AQUA_REVIEW"] },
  { id: "artwork", label: "Artwork", statuses: ["ARTWORK_AQUA_REVIEW"] },
  { id: "approval", label: "Kundgodkännande", statuses: ["ARTWORK_CUSTOMER_APPROVAL"] },
  { id: "confirmed", label: "Orderbekräftad", statuses: ["CONFIRMED"] },
  { id: "labels", label: "Etiketter", statuses: ["LABEL_PRODUCTION"] },
  { id: "labels_out", label: "Etiketter skickade", statuses: ["LABELS_DISPATCHED"] },
  { id: "bottler", label: "Bottler", statuses: ["LABELS_RECEIVED", "PRODUCTION_SCHEDULED"] },
  { id: "production", label: "Produktion", statuses: ["IN_PRODUCTION"] },
  { id: "ready_ship", label: "Klar för leverans", statuses: ["READY_TO_SHIP"] },
  { id: "shipped", label: "Skickad", statuses: ["SHIPPED"] },
  { id: "delivered", label: "Levererad", statuses: ["DELIVERED"] },
  { id: "ready_invoice", label: "Redo att fakturera", statuses: ["READY_TO_INVOICE"] },
  { id: "invoiced", label: "Fakturerad", statuses: ["INVOICED", "PAID"] },
] as const;

/** Grova filterflikar för ordermottagning — samma idé som husets lista. */
export const ORDER_LIST_LANES = [
  {
    id: "active",
    label: "Aktiv",
    statuses: [
      "SUBMITTED",
      "AQUA_REVIEW",
      "ARTWORK_AQUA_REVIEW",
      "ARTWORK_CUSTOMER_APPROVAL",
      "CONFIRMED",
      "LABEL_PRODUCTION",
      "LABELS_DISPATCHED",
      "LABELS_RECEIVED",
      "PRODUCTION_SCHEDULED",
      "IN_PRODUCTION",
      "READY_TO_SHIP",
      "SHIPPED",
    ],
  },
  {
    id: "received",
    label: "Mottagen",
    statuses: ["SUBMITTED", "AQUA_REVIEW", "ARTWORK_AQUA_REVIEW", "ARTWORK_CUSTOMER_APPROVAL"],
  },
  {
    id: "production",
    label: "Tillverkning",
    statuses: [
      "CONFIRMED",
      "LABEL_PRODUCTION",
      "LABELS_DISPATCHED",
      "LABELS_RECEIVED",
      "PRODUCTION_SCHEDULED",
      "IN_PRODUCTION",
    ],
  },
  { id: "shipped", label: "Skickad", statuses: ["READY_TO_SHIP", "SHIPPED"] },
  { id: "delivered", label: "Levererad", statuses: ["DELIVERED", "READY_TO_INVOICE", "INVOICED", "PAID"] },
] as const;

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatusCode, readonly OrderStatusCode[]> = {
  SUBMITTED: ["AQUA_REVIEW"],
  AQUA_REVIEW: ["ARTWORK_AQUA_REVIEW"],
  ARTWORK_AQUA_REVIEW: ["ARTWORK_CUSTOMER_APPROVAL"],
  ARTWORK_CUSTOMER_APPROVAL: ["CONFIRMED"],
  CONFIRMED: ["LABEL_PRODUCTION"],
  LABEL_PRODUCTION: ["LABELS_DISPATCHED"],
  LABELS_DISPATCHED: ["LABELS_RECEIVED"],
  LABELS_RECEIVED: ["PRODUCTION_SCHEDULED"],
  PRODUCTION_SCHEDULED: ["IN_PRODUCTION"],
  IN_PRODUCTION: ["READY_TO_SHIP"],
  READY_TO_SHIP: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["READY_TO_INVOICE"],
  READY_TO_INVOICE: ["INVOICED"],
  INVOICED: ["PAID"],
  PAID: [],
};

export function canTransition(from: string, to: string) {
  const allowed = ORDER_STATUS_TRANSITIONS[from as OrderStatusCode];
  return Boolean(allowed?.includes(to as OrderStatusCode));
}

export const FACTORY_JOB_LABELS: Record<string, string> = {
  NOT_PLANNED: "Mottagen",
  ACCEPTED: "Mottagen",
  STARTED: "Startad",
  DONE: "Klar",
  ISSUE_FLAGGED: "Problem",
};

export const FACTORY_EVENT_LABELS: Record<string, string> = {
  ACCEPT_DEADLINE: "Sista skickdatum accepterat",
  FLAG_ISSUE: "Problem flaggat",
  DISPATCH: "Etiketter skickade",
  RECEIVE_LABELS: "Etiketter mottagna",
  ESTIMATE_DATE: "Estimerat datum",
  READY_DATE: "Estimerat bottler-datum",
  START: "Produktion startad",
  DONE: "Klar",
  SHIPPED: "Skickad",
};

export const EVENT_LABELS: Record<string, string> = {
  ...ORDER_STEP_LABELS,
  ...FACTORY_JOB_LABELS,
  ...FACTORY_EVENT_LABELS,
  SUBMITTED: "Order inskickad av kund",
  AQUA_REVIEW: "Aqua-granskning startad",
  ARTWORK_AQUA_REVIEW: "Artwork godkänd av Aqua",
  ARTWORK_CUSTOMER_APPROVAL: "Korrektur skickad till kund",
  CONFIRMED: "Slutlig OB skickad",
  LABEL_PRODUCTION: "Etiketter i produktion",
  LABELS_DISPATCHED: "Etiketter skickade",
  LABELS_RECEIVED: "Etiketter mottagna av bottler",
  PRODUCTION_SCHEDULED: "Bottler planerade produktion",
  READY_TO_SHIP: "Klar för leverans",
  SHIPPED: "Markerad som skickad",
  DELIVERED: "Markerad som levererad",
  READY_TO_INVOICE: "Redo att fakturera",
  DELIVERY_DATE_APPROVED: "Aqua godkände leveransdatum",
  WAYBILL_READY: "Fraktsedel klar",
  CUSTOMER_FINAL: "Artwork godkänd av kund",
};

export function eventLabel(toStatus: string) {
  return EVENT_LABELS[toStatus] ?? toStatus;
}

export const FACTORY_PRODUCTION_STEPS = [
  { id: "received", label: "Mottagen", statuses: ["NOT_PLANNED", "ACCEPTED", "ISSUE_FLAGGED"] },
  { id: "started", label: "Startad", statuses: ["STARTED"] },
  { id: "done", label: "Klar", statuses: ["DONE"] },
] as const;

export function statusTone(status: string, requestedDate?: string | null): "done" | "next" | "blocked" | "idle" {
  const overdue = Boolean(
    requestedDate &&
      new Date(requestedDate) < new Date() &&
      !["DELIVERED", "INVOICED", "PAID", "READY_TO_INVOICE", "DONE"].includes(status),
  );
  if (overdue || status === "ISSUE_FLAGGED") return "blocked";
  if (["PAID", "DELIVERED", "INVOICED", "CONFIRMED", "DONE"].includes(status)) return "done";
  if (
    [
      "READY_TO_INVOICE",
      "ARTWORK_CUSTOMER_APPROVAL",
      "AQUA_REVIEW",
      "READY_TO_SHIP",
      "STARTED",
      "ACCEPTED",
      "LABEL_PRODUCTION",
      "LABELS_RECEIVED",
    ].includes(status)
  )
    return "next";
  return "idle";
}

export const CATEGORY_META: Record<string, { slug: string; name: string; enum: string }> = {
  profilvatten: { slug: "profilvatten", name: "Profilvatten", enum: "WATER" },
  pappersmuggar: { slug: "pappersmuggar", name: "Pappersmuggar", enum: "PAPER_CUP" },
  energidryck: { slug: "energidryck", name: "Energidryck", enum: "ENERGY_DRINK" },
  sportflaskor: { slug: "sportflaskor", name: "Sportflaskor", enum: "SPORTS_BOTTLE" },
  "lask-must": { slug: "lask-must", name: "Läsk & Must", enum: "SOFT_DRINK" },
  kyl: { slug: "kyl", name: "Kyl", enum: "COOLER" },
};

export const CUP_PRINT_REQUIREMENTS = [
  { code: "volume", label: "Volym", required: true },
  { code: "ean", label: "EAN", required: true },
  { code: "pant", label: "Pant", required: true },
  { code: "producer", label: "Producentuppgifter", required: true },
  { code: "ingredients", label: "Ingredienser", required: true },
  { code: "product_name", label: "Produktnamn", required: true },
] as const;

export const REPEAT_HORIZONS = [0, 3, 6, 9, 12] as const;

export function invoiceBuyerLabel(status: string, dueAt?: Date | string | null) {
  if (status === "PAID") return "Betald";
  const due = dueAt ? new Date(dueAt) : null;
  if (due && !Number.isNaN(due.getTime()) && due < new Date()) return "Förfallen";
  return "Obetald";
}

export const LEAD_STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Kommande",
  ACTIVE: "Aktuell",
  CUSTOMER_REMINDED: "Kund påmind",
  CONTACTED: "Kontaktad",
  REPEAT_CREATED: "Ny order skapad",
  SNOOZED: "Uppskjuten",
  NOT_RELEVANT: "Ej aktuell",
};

export const DESIGN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Utkast",
  SUBMITTED: "Inskickad",
  ATTACHED_TO_ORDER: "Kopplad till order",
};

export const DOCUMENT_KIND_LABELS: Record<string, string> = {
  PROOF: "Korrektur",
  ORDER: "Orderbekräftelse",
  WAYBILL: "Fraktsedel",
  FINANCE: "Faktura",
  ARTWORK: "Artwork",
  PRODUCTION: "Produktion",
  LOGISTICS: "Logistik",
};
