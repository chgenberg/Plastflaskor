export type SupplierKind = "label" | "bottler";

export type SupplierJobLike = {
  order: {
    currentStatus: string;
    factoryDeadlineAccepted: boolean;
    factoryDeadline?: string | null;
    aquaApprovedDelivery?: string | null;
    factoryReadyEstimate?: string | null;
  };
};

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isoWeekBounds(from = new Date()) {
  const day = from.getDay() || 7;
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  start.setDate(from.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: ymd(start), end: ymd(end) };
}

export function inIsoWeek(value?: string | null, from = new Date()) {
  if (!value) return false;
  const { start, end } = isoWeekBounds(from);
  return value >= start && value <= end;
}

export function supplierCounts(visible: SupplierJobLike[], shipped: SupplierJobLike[], kind: SupplierKind, today = new Date()) {
  if (kind === "label") {
    const toAccept = visible.filter(
      (j) =>
        !j.order.factoryDeadlineAccepted &&
        (j.order.currentStatus === "CONFIRMED" || j.order.currentStatus === "LABEL_PRODUCTION"),
    ).length;
    const active = visible.filter(
      (j) => j.order.factoryDeadlineAccepted && j.order.currentStatus === "LABEL_PRODUCTION",
    ).length;
    const dueThisWeek = visible.filter((j) => inIsoWeek(j.order.factoryDeadline, today)).length;
    return { toAccept, active, dueThisWeek, shipped: shipped.length };
  }
  const toAccept = visible.filter((j) => j.order.currentStatus === "LABELS_DISPATCHED").length;
  const active = visible.filter((j) =>
    ["LABELS_RECEIVED", "PRODUCTION_SCHEDULED", "IN_PRODUCTION"].includes(j.order.currentStatus),
  ).length;
  const dueThisWeek = visible.filter((j) =>
    inIsoWeek(j.order.aquaApprovedDelivery ?? j.order.factoryReadyEstimate, today),
  ).length;
  return { toAccept, active, dueThisWeek, shipped: shipped.length };
}

export function supplierActionLabel(kind: SupplierKind, job: SupplierJobLike, today = new Date()) {
  const status = job.order.currentStatus;
  const todayYmd = ymd(today);
  if (kind === "label") {
    if (!job.order.factoryDeadlineAccepted && (status === "CONFIRMED" || status === "LABEL_PRODUCTION")) {
      return job.order.factoryDeadline ? `Acceptera deadline ${job.order.factoryDeadline}` : "Acceptera deadline";
    }
    if (job.order.factoryDeadlineAccepted && job.order.factoryDeadline && job.order.factoryDeadline < todayYmd) {
      return "Rapportera POD — deadline passerad";
    }
    return "Öppna jobb";
  }
  if (status === "LABELS_DISPATCHED") return "Ta emot etiketter";
  if (status === "READY_TO_SHIP") return "Rapportera POD / skicka";
  return "Öppna jobb";
}
