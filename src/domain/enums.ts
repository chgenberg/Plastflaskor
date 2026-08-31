export const ORDER_STEPS = [
  "SUBMITTED",
  "AQUA_REVIEW",
  "ARTWORK_AQUA_REVIEW",
  "ARTWORK_CUSTOMER_APPROVAL",
  "CONFIRMED",
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
  ARTWORK_AQUA_REVIEW: "Korrektur",
  ARTWORK_CUSTOMER_APPROVAL: "Korrektur",
  CONFIRMED: "Bekräftad",
  IN_PRODUCTION: "Produktion",
  READY_TO_SHIP: "Förbereds för leverans",
  SHIPPED: "Skickad",
  DELIVERED: "Levererad",
  READY_TO_INVOICE: "Levererad",
  INVOICED: "Fakturerad",
  PAID: "Fakturerad",
};

/** @deprecated use BUYER_STATUS */
export const RESELLER_STATUS = BUYER_STATUS;

export const PIPELINE_PHASES = [
  { id: "new", label: "Nya ordrar", statuses: ["SUBMITTED", "AQUA_REVIEW"] },
  { id: "artwork", label: "Korrektur", statuses: ["ARTWORK_AQUA_REVIEW", "ARTWORK_CUSTOMER_APPROVAL"] },
  { id: "confirmed", label: "Bekräftade", statuses: ["CONFIRMED"] },
  { id: "production", label: "Tryckeri", statuses: ["IN_PRODUCTION"] },
  { id: "ready_ship", label: "Klara för leverans", statuses: ["READY_TO_SHIP"] },
  { id: "shipped", label: "Skickade", statuses: ["SHIPPED"] },
  { id: "delivered", label: "Levererade", statuses: ["DELIVERED"] },
  { id: "ready_invoice", label: "Redo att faktureras", statuses: ["READY_TO_INVOICE"] },
  { id: "invoiced", label: "Fakturerade", statuses: ["INVOICED", "PAID"] },
] as const;

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatusCode, readonly OrderStatusCode[]> = {
  SUBMITTED: ["AQUA_REVIEW"],
  AQUA_REVIEW: ["ARTWORK_AQUA_REVIEW"],
  ARTWORK_AQUA_REVIEW: ["ARTWORK_CUSTOMER_APPROVAL"],
  ARTWORK_CUSTOMER_APPROVAL: ["CONFIRMED"],
  CONFIRMED: ["IN_PRODUCTION"],
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
  ACCEPT_DEADLINE: "Deadline accepterad",
  FLAG_ISSUE: "Problem flaggat",
  START: "Produktion startad",
  DONE: "Klar",
  SHIPPED: "Skickad",
};

export const EVENT_LABELS: Record<string, string> = {
  ...ORDER_STEP_LABELS,
  ...FACTORY_JOB_LABELS,
  ...FACTORY_EVENT_LABELS,
  DELIVERY_DATE_APPROVED: "Leveransdatum godkänt",
  WAYBILL_READY: "Fraktsedel klar",
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
  if (["READY_TO_INVOICE", "ARTWORK_CUSTOMER_APPROVAL", "AQUA_REVIEW", "READY_TO_SHIP", "STARTED", "ACCEPTED"].includes(status))
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
  { code: "producer", label: "Producentuppgifter", required: true },
  { code: "recycling", label: "Återvinning / FSC / OK Compost", required: true },
  { code: "food_contact", label: "Livsmedelsgodkännande", required: true },
  { code: "product_name", label: "Produktnamn", required: false },
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
  ARTWORK: "Tryckfil",
  PRODUCTION: "Produktion",
  LOGISTICS: "Logistik",
};
