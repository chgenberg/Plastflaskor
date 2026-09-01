import { Role } from "@prisma/client";
import { prisma } from "../db";
import { renderSimplePdf } from "../pdf/simplePdf";
import { putLocalFile } from "../storage/local";
import { factoryAdvance } from "./production.service";

export type LabelDispatchSummary = {
  id: string;
  reportNo: string;
  trackingNo: string;
  notes: string;
  createdAt: string;
  jobIds: string[];
  orderNos: string[];
  qty: number;
  orderCount: number;
  documentId: string | null;
};

async function nextReportNo() {
  const year = new Date().getFullYear();
  const prefix = `LR-${year}-`;
  const last = await prisma.labelDispatch.findFirst({
    where: { reportNo: { startsWith: prefix } },
    orderBy: { reportNo: "desc" },
  });
  const n = last ? Number(last.reportNo.slice(prefix.length)) + 1 : 1;
  if (!Number.isFinite(n) || n < 1) throw new Error("Kunde inte skapa rapportnummer");
  return `${prefix}${String(n).padStart(4, "0")}`;
}

export async function listLabelDispatches(
  factoryId?: string,
  opts?: { chronological?: boolean },
): Promise<LabelDispatchSummary[]> {
  const rows = await prisma.labelDispatch.findMany({
    where: factoryId ? { factoryId } : {},
    include: { lines: true },
    orderBy: { createdAt: opts?.chronological ? "asc" : "desc" },
  });
  const entityIds = rows.map((r) => r.id);
  const orderIds = [...new Set(rows.flatMap((r) => r.lines.map((l) => l.orderId)))];
  const docs =
    entityIds.length === 0
      ? []
      : await prisma.document.findMany({
          where: { entityType: "LABEL_DISPATCH", entityId: { in: entityIds } },
          select: { id: true, entityId: true },
        });
  const orders =
    orderIds.length === 0
      ? []
      : await prisma.order.findMany({
          where: { id: { in: orderIds } },
          select: { id: true, orderNo: true },
        });
  const orderNoById = new Map(orders.map((o) => [o.id, o.orderNo]));
  const docByEntity = new Map(docs.map((d) => [d.entityId, d.id]));
  return rows.map((r) => ({
    id: r.id,
    reportNo: r.reportNo,
    trackingNo: r.trackingNo,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    jobIds: r.lines.map((l) => l.jobId),
    orderNos: r.lines.map((l) => orderNoById.get(l.orderId)).filter((n): n is string => Boolean(n)),
    qty: r.lines.reduce((sum, l) => sum + l.qty, 0),
    orderCount: r.lines.length,
    documentId: docByEntity.get(r.id) ?? null,
  }));
}

export type InboundDispatchCard = {
  reportNo: string;
  orderCount: number;
  qty: number;
  shippedAt: string;
  trackingNo: string;
};

export type InboundDispatchLine = {
  id: string;
  orderId: string;
  orderNo: string;
  customerName: string;
  qty: number;
  received: boolean;
  canReceive: boolean;
};

export type InboundDispatchDetail = {
  id: string;
  reportNo: string;
  trackingNo: string;
  notes: string;
  shippedAt: string;
  receivedAt: string | null;
  deviationNote: string;
  documentId: string | null;
  lines: InboundDispatchLine[];
};

export async function listInboundLabelDispatches(bottlerFactoryId?: string): Promise<InboundDispatchCard[]> {
  const rows = await prisma.labelDispatch.findMany({
    where: { receivedAt: null },
    include: { lines: true },
    orderBy: { createdAt: "desc" },
  });
  const orderIds = [...new Set(rows.flatMap((r) => r.lines.map((l) => l.orderId)))];
  const orders =
    orderIds.length === 0
      ? []
      : await prisma.order.findMany({
          where: {
            id: { in: orderIds },
            currentStatus: "LABELS_DISPATCHED",
            ...(bottlerFactoryId ? { factoryId: bottlerFactoryId } : {}),
          },
          select: { id: true },
        });
  const allowed = new Set(orders.map((o) => o.id));
  return rows
    .map((r) => {
      const pending = r.lines.filter((l) => !l.received && allowed.has(l.orderId));
      return {
        reportNo: r.reportNo,
        orderCount: pending.length,
        qty: pending.reduce((sum, l) => sum + l.qty, 0),
        shippedAt: r.createdAt.toISOString(),
        trackingNo: r.trackingNo,
      };
    })
    .filter((r) => r.orderCount > 0);
}

export async function getInboundLabelDispatch(
  reportNo: string,
  bottlerFactoryId?: string,
): Promise<InboundDispatchDetail | null> {
  const row = await prisma.labelDispatch.findUnique({
    where: { reportNo },
    include: { lines: true },
  });
  if (!row) return null;
  const orders = await prisma.order.findMany({
    where: {
      id: { in: row.lines.map((l) => l.orderId) },
      ...(bottlerFactoryId ? { factoryId: bottlerFactoryId } : {}),
    },
    select: {
      id: true,
      orderNo: true,
      currentStatus: true,
      customer: { select: { name: true } },
    },
  });
  if (orders.length === 0) return null;
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const doc = await prisma.document.findFirst({
    where: { entityType: "LABEL_DISPATCH", entityId: row.id },
    select: { id: true },
  });
  const lines = row.lines
    .map((l) => {
      const order = orderById.get(l.orderId);
      if (!order) return null;
      return {
        id: l.id,
        orderId: l.orderId,
        orderNo: order.orderNo,
        customerName: order.customer.name,
        qty: l.qty,
        received: l.received,
        canReceive: !l.received && order.currentStatus === "LABELS_DISPATCHED",
      };
    })
    .filter((l): l is InboundDispatchLine => Boolean(l));
  if (lines.length === 0) return null;
  return {
    id: row.id,
    reportNo: row.reportNo,
    trackingNo: row.trackingNo,
    notes: row.notes,
    shippedAt: row.createdAt.toISOString(),
    receivedAt: row.receivedAt?.toISOString() ?? null,
    deviationNote: row.deviationNote,
    documentId: doc?.id ?? null,
    lines,
  };
}

export async function receiveLabelDispatch(input: {
  reportNo: string;
  lineIds: string[];
  deviationNote: string;
  actorRole: Role;
  scopedFactoryId?: string;
}) {
  const detail = await getInboundLabelDispatch(input.reportNo, input.scopedFactoryId);
  if (!detail) throw new Error("Leveransrapport saknas");
  if (detail.receivedAt) throw new Error("Rapporten är redan inlevererad");
  const selected = new Set(input.lineIds.filter(Boolean));
  const pending = detail.lines.filter((l) => l.canReceive);
  const chosen = pending.filter((l) => selected.has(l.id));
  const deviation = input.deviationNote.trim();
  if (chosen.length === 0 && !deviation) {
    throw new Error("Kryssa i ordrarna som kommit, eller ange avvikelse");
  }
  if (chosen.length < pending.length && !deviation) {
    throw new Error("Ange avvikelse när inte hela leveransen kommit");
  }

  for (const line of chosen) {
    const job = await prisma.productionJob.findFirst({
      where: { orderId: line.orderId, factory: { kind: "bottler" } },
    });
    if (!job) throw new Error(`Bottlerjobb saknas för ${line.orderNo}`);
    if (input.scopedFactoryId && job.factoryId !== input.scopedFactoryId) {
      throw new Error("Forbidden");
    }
    await factoryAdvance(job.id, job.factoryId, "RECEIVE_LABELS", input.actorRole);
    await prisma.labelDispatchLine.update({ where: { id: line.id }, data: { received: true } });
  }

  await prisma.labelDispatch.update({
    where: { id: detail.id },
    data: { receivedAt: new Date(), deviationNote: deviation },
  });
  return detail.reportNo;
}

export function reportNoByJobId(reports: LabelDispatchSummary[]) {
  const map = new Map<string, string>();
  for (const report of reports) {
    for (const jobId of report.jobIds) map.set(jobId, report.reportNo);
  }
  return map;
}

export async function createLabelDispatch(input: {
  jobIds: string[];
  trackingNo: string;
  notes: string;
  actorRole: Role;
  scopedFactoryId?: string;
}) {
  const trackingNo = input.trackingNo.trim();
  if (!trackingNo) throw new Error("Ange trackingnummer");
  const jobIds = [...new Set(input.jobIds.map((id) => id.trim()).filter(Boolean))];
  if (jobIds.length === 0) throw new Error("Välj minst en order");

  const jobs = await prisma.productionJob.findMany({
    where: {
      id: { in: jobIds },
      ...(input.scopedFactoryId ? { factoryId: input.scopedFactoryId } : {}),
    },
    include: {
      factory: true,
      order: {
        include: {
          items: { include: { variant: { include: { product: true } } } },
          customer: { select: { name: true } },
        },
      },
    },
  });
  if (jobs.length !== jobIds.length) throw new Error("Ett eller flera jobb saknas");
  if (jobs.some((job) => job.factory.kind !== "label")) {
    throw new Error("Bara etikettjobb kan ingå i en leveransrapport");
  }
  const factoryIds = new Set(jobs.map((job) => job.factoryId));
  if (factoryIds.size !== 1) {
    throw new Error("Alla ordrar måste tillhöra samma etikettleverantör");
  }
  const factoryId = jobs[0]!.factoryId;

  for (const job of jobs) {
    const status = job.order.currentStatus;
    if (status !== "CONFIRMED" && status !== "LABEL_PRODUCTION") {
      throw new Error(`${job.order.orderNo} kan inte skickas`);
    }
  }

  const reportNo = await nextReportNo();

  for (const job of jobs) {
    if (!job.order.factoryDeadlineAccepted || job.order.currentStatus === "CONFIRMED") {
      await factoryAdvance(job.id, factoryId, "ACCEPT_DEADLINE", input.actorRole);
    }
    await factoryAdvance(job.id, factoryId, "DISPATCH", input.actorRole, {
      trackingNo,
      carrier: "PostNord",
      waybillNo: reportNo,
    });
  }

  const dispatch = await prisma.labelDispatch.create({
    data: {
      reportNo,
      factoryId,
      trackingNo,
      notes: input.notes.trim(),
      lines: {
        create: jobs.map((job) => ({
          jobId: job.id,
          orderId: job.orderId,
          qty: job.order.items.reduce((sum, item) => sum + item.qty, 0),
        })),
      },
    },
    include: { lines: true },
  });

  const qty = dispatch.lines.reduce((sum, line) => sum + line.qty, 0);
  const lines = jobs.map((job) => {
    const qtyLine = job.order.items.reduce((sum, item) => sum + item.qty, 0);
    const product = job.order.items[0]?.variant.product.name ?? "Etikett";
    return `${job.order.orderNo}  ${job.order.customer.name}  ${product}  ${qtyLine} st`;
  });
  const pdf = renderSimplePdf(`Leveransrapport ${reportNo}`, [
    "Fakturaunderlag för etikettleverans till bottler.",
    `Datum: ${new Date().toLocaleDateString("sv-SE")}`,
    `Tracking: ${trackingNo}`,
    input.notes.trim() ? `Anteckning: ${input.notes.trim()}` : "",
    "",
    ...lines,
    "",
    `Totalt: ${jobs.length} ordrar, ${qty} etiketter`,
    "",
    "Ingen pris- eller fakturainformation. Rapportnumret används som underlag.",
  ]);
  const storageKey = `label-dispatches/${reportNo}.pdf`;
  await putLocalFile(storageKey, pdf);
  await prisma.document.create({
    data: {
      orderId: jobs[0]!.orderId,
      entityType: "LABEL_DISPATCH",
      entityId: dispatch.id,
      kind: "LOGISTICS",
      title: `Leveransrapport ${reportNo}`,
      storageKey,
    },
  });

  return dispatch;
}
