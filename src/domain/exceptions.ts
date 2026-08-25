import { isOverdue } from "./orderBrief";

export type ExceptionKind =
  | "quote"
  | "artwork_missing"
  | "artwork_approval"
  | "order_labels"
  | "ship_labels"
  | "waybill"
  | "mark_shipped"
  | "delivery"
  | "invoice"
  | "overdue";

export type Exception = {
  kind: ExceptionKind;
  label: string;
  href: string;
  orderNo: string;
};

type OrderLike = {
  orderNo: string;
  currentStatus: string;
  source: string;
  requestedDate?: string | null;
};

const RULES: { kind: ExceptionKind; label: string; href: (o: OrderLike) => string; match: (o: OrderLike) => boolean }[] = [
  {
    kind: "quote",
    label: "Ny offert att ta hand om",
    href: () => `/operations/ordrar?source=quote`,
    match: (o) => o.source === "public_quote" && o.currentStatus === "ORDER_RECEIVED",
  },
  {
    kind: "artwork_missing",
    label: "Väntar på artwork",
    href: (o) => `/operations/ordrar/${o.orderNo}`,
    match: (o) => o.source !== "public_quote" && o.currentStatus === "ORDER_RECEIVED",
  },
  {
    kind: "artwork_approval",
    label: "Artwork att godkänna",
    href: () => `/operations/ordrar?phase=artwork_approval`,
    match: (o) => o.currentStatus === "ARTWORK_UPLOADED",
  },
  {
    kind: "order_labels",
    label: "Beställ etiketter",
    href: () => `/operations/etiketter`,
    match: (o) => o.currentStatus === "ARTWORK_APPROVED",
  },
  {
    kind: "ship_labels",
    label: "Skicka etiketter till fabrik",
    href: () => `/operations/etiketter?filter=not_shipped`,
    match: (o) => o.currentStatus === "LABELS_PRINTED",
  },
  {
    kind: "waybill",
    label: "Saknar fraktsedel",
    href: (o) => `/operations/ordrar/${o.orderNo}`,
    match: (o) => o.currentStatus === "PRODUCTION_DONE",
  },
  {
    kind: "mark_shipped",
    label: "Markera skickad",
    href: (o) => `/operations/ordrar/${o.orderNo}`,
    match: (o) => o.currentStatus === "WAYBILL_CREATED",
  },
  {
    kind: "delivery",
    label: "Synka leverans",
    href: (o) => `/operations/ordrar/${o.orderNo}`,
    match: (o) => o.currentStatus === "SHIPPED_TO_END_CUSTOMER",
  },
  {
    kind: "invoice",
    label: "Redo att fakturera",
    href: (o) => `/operations/ekonomi/${o.orderNo}/fakturera`,
    match: (o) => o.currentStatus === "READY_TO_INVOICE" || o.currentStatus === "DELIVERED",
  },
  {
    kind: "overdue",
    label: "Försenad mot leveransdatum",
    href: () => `/operations/ordrar?late=1`,
    match: (o) => isOverdue(o.currentStatus, o.requestedDate),
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
        });
      }
    }
  }
  return out;
}

export function exceptionSummary(items: Exception[]) {
  const map = new Map<ExceptionKind, { kind: ExceptionKind; label: string; href: string; count: number }>();
  for (const item of items) {
    const prev = map.get(item.kind);
    if (prev) prev.count += 1;
    else map.set(item.kind, { kind: item.kind, label: item.label, href: item.href, count: 1 });
  }
  return [...map.values()];
}
