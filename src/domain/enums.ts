export const ORDER_STEPS = [
  "ORDER_RECEIVED",
  "ARTWORK_UPLOADED",
  "ARTWORK_APPROVED",
  "LABELS_ORDERED",
  "LABELS_PRINTED",
  "LABELS_SHIPPED_TO_FACTORY",
  "LABELS_RECEIVED_BY_FACTORY",
  "PRODUCTION_PLANNED",
  "PRODUCTION_STARTED",
  "BOTTLES_FILLED",
  "LABELS_APPLIED",
  "PRODUCTION_DONE",
  "WAYBILL_CREATED",
  "SHIPPED_TO_END_CUSTOMER",
  "DELIVERED",
  "READY_TO_INVOICE",
  "INVOICED",
  "PAID",
] as const;

export type OrderStatusCode = (typeof ORDER_STEPS)[number];

export const ORDER_STEP_LABELS: Record<OrderStatusCode, string> = {
  ORDER_RECEIVED: "Order mottagen",
  ARTWORK_UPLOADED: "Artwork uppladdat",
  ARTWORK_APPROVED: "Artwork godkänt",
  LABELS_ORDERED: "Etiketter beställda",
  LABELS_PRINTED: "Etiketter tryckta",
  LABELS_SHIPPED_TO_FACTORY: "Etiketter skickade till fabrik",
  LABELS_RECEIVED_BY_FACTORY: "Etiketter mottagna av fabrik",
  PRODUCTION_PLANNED: "Produktion planerad",
  PRODUCTION_STARTED: "Produktion startad",
  BOTTLES_FILLED: "Flaskor fyllda",
  LABELS_APPLIED: "Etiketter applicerade",
  PRODUCTION_DONE: "Produktion klar",
  WAYBILL_CREATED: "Fraktsedel skapad",
  SHIPPED_TO_END_CUSTOMER: "Skickad till slutkund",
  DELIVERED: "Levererad",
  READY_TO_INVOICE: "Redo för fakturering",
  INVOICED: "Fakturerad",
  PAID: "Betald",
};

export const RESELLER_STATUS: Record<string, string> = {
  ORDER_RECEIVED: "Mottagen",
  ARTWORK_UPLOADED: "Korrektur",
  ARTWORK_APPROVED: "Korrektur",
  LABELS_ORDERED: "Produktion",
  LABELS_PRINTED: "Produktion",
  LABELS_SHIPPED_TO_FACTORY: "Produktion",
  LABELS_RECEIVED_BY_FACTORY: "Produktion",
  PRODUCTION_PLANNED: "Produktion",
  PRODUCTION_STARTED: "Produktion",
  BOTTLES_FILLED: "Produktion",
  LABELS_APPLIED: "Produktion",
  PRODUCTION_DONE: "Produktion",
  WAYBILL_CREATED: "Skickad",
  SHIPPED_TO_END_CUSTOMER: "Skickad",
  DELIVERED: "Levererad",
  READY_TO_INVOICE: "Levererad",
  INVOICED: "Fakturerad",
  PAID: "Fakturerad",
};

export const PIPELINE_PHASES = [
  { id: "awaiting_artwork", label: "Väntar artwork", statuses: ["ORDER_RECEIVED"] },
  { id: "artwork_approval", label: "Artwork approval", statuses: ["ARTWORK_UPLOADED"] },
  { id: "label_production", label: "Etikettproduktion", statuses: ["ARTWORK_APPROVED", "LABELS_ORDERED", "LABELS_PRINTED"] },
  { id: "to_factory", label: "På väg till fabrik", statuses: ["LABELS_SHIPPED_TO_FACTORY"] },
  { id: "in_factory", label: "I fabrik", statuses: ["LABELS_RECEIVED_BY_FACTORY", "PRODUCTION_PLANNED", "PRODUCTION_STARTED", "BOTTLES_FILLED", "LABELS_APPLIED"] },
  { id: "ready_ship", label: "Klara för leverans", statuses: ["PRODUCTION_DONE", "WAYBILL_CREATED"] },
  { id: "shipped", label: "Skickade", statuses: ["SHIPPED_TO_END_CUSTOMER", "DELIVERED"] },
  { id: "ready_invoice", label: "Redo att faktureras", statuses: ["READY_TO_INVOICE"] },
] as const;

export function statusTone(status: string): "done" | "next" | "blocked" | "idle" {
  if (["PAID", "DELIVERED", "INVOICED", "PRODUCTION_DONE"].includes(status)) return "done";
  if (["READY_TO_INVOICE", "ARTWORK_UPLOADED", "WAYBILL_CREATED", "LABELS_PRINTED"].includes(status)) return "next";
  if (status.includes("BLOCK") || status === "ARTWORK_UPLOADED") return "next";
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
