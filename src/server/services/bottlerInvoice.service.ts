import { prisma } from "../db";
import { planFromItem, planLabels } from "@/domain/bottlerPlan";
import { renderSimplePdf } from "../pdf/simplePdf";
import { putLocalFile } from "../storage/local";

export type BottlerInvoiceSummary = {
  id: string;
  reportNo: string;
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
  const prefix = `BF-${year}-`;
  const last = await prisma.bottlerInvoiceReport.findFirst({
    where: { reportNo: { startsWith: prefix } },
    orderBy: { reportNo: "desc" },
  });
  const n = last ? Number(last.reportNo.slice(prefix.length)) + 1 : 1;
  if (!Number.isFinite(n) || n < 1) throw new Error("Kunde inte skapa underlagsnummer");
  return `${prefix}${String(n).padStart(4, "0")}`;
}

export async function listBottlerInvoices(
  factoryId?: string,
  opts?: { chronological?: boolean },
): Promise<BottlerInvoiceSummary[]> {
  const rows = await prisma.bottlerInvoiceReport.findMany({
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
          where: { entityType: "BOTTLER_INVOICE", entityId: { in: entityIds } },
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
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    jobIds: r.lines.map((l) => l.jobId),
    orderNos: r.lines.map((l) => orderNoById.get(l.orderId)).filter((n): n is string => Boolean(n)),
    qty: r.lines.reduce((sum, l) => sum + l.qty, 0),
    orderCount: r.lines.length,
    documentId: docByEntity.get(r.id) ?? null,
  }));
}

export async function billedJobIds(factoryId?: string) {
  const lines = await prisma.bottlerInvoiceLine.findMany({
    where: factoryId ? { report: { factoryId } } : {},
    select: { jobId: true },
  });
  return new Set(lines.map((l) => l.jobId));
}

export async function createBottlerInvoice(input: {
  jobIds: string[];
  notes: string;
  scopedFactoryId?: string;
}) {
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
          shipments: { where: { type: "GOODS_TO_CUSTOMER" }, select: { trackingNo: true } },
        },
      },
    },
  });
  if (jobs.length !== jobIds.length) throw new Error("Ett eller flera jobb saknas");
  if (jobs.some((job) => job.factory.kind !== "bottler")) {
    throw new Error("Bara flaskjobb kan ingå i underlaget");
  }
  const factoryIds = new Set(jobs.map((job) => job.factoryId));
  if (factoryIds.size !== 1) throw new Error("Alla ordrar måste tillhöra samma bottler");
  const factoryId = jobs[0]!.factoryId;
  if (jobs.some((job) => job.order.currentStatus !== "SHIPPED")) {
    throw new Error("Bara skickade ordrar kan ingå i underlaget");
  }
  const already = await prisma.bottlerInvoiceLine.findMany({
    where: { jobId: { in: jobIds } },
    select: { jobId: true },
  });
  if (already.length > 0) throw new Error("En eller flera ordrar finns redan i ett underlag");

  const reportNo = await nextReportNo();
  const report = await prisma.bottlerInvoiceReport.create({
    data: {
      reportNo,
      factoryId,
      notes: input.notes.trim(),
      lines: {
        create: jobs.map((job) => {
          const item = job.order.items[0];
          const plan = planFromItem({
            volumeMl: item?.variant.volumeMl,
            visualSpecJson: job.order.visualSpecJson ?? item?.visualSpecJson,
            optionsJson: item?.variant.optionsJson,
            productName: item?.variant.product.name,
          });
          return {
            jobId: job.id,
            orderId: job.orderId,
            qty: job.order.items.reduce((sum, line) => sum + line.qty, 0),
            size: plan.size,
            water: plan.water,
            cap: plan.cap,
            trackingNo: job.order.shipments[0]?.trackingNo ?? "",
          };
        }),
      },
    },
    include: { lines: true },
  });

  const qty = report.lines.reduce((sum, line) => sum + line.qty, 0);
  const pdfLines = jobs.map((job) => {
    const item = job.order.items[0];
    const labels = planLabels(
      planFromItem({
        volumeMl: item?.variant.volumeMl,
        visualSpecJson: job.order.visualSpecJson ?? item?.visualSpecJson,
        optionsJson: item?.variant.optionsJson,
        productName: item?.variant.product.name,
      }),
    );
    const qtyLine = job.order.items.reduce((sum, line) => sum + line.qty, 0);
    const tracking = job.order.shipments[0]?.trackingNo ?? "–";
    return `${job.order.orderNo}  ${job.order.customer.name}  ${item?.variant.product.name ?? "Profilvatten"}  ${labels.size}  ${labels.water}  ${labels.cap}  ${qtyLine} st  ${tracking}`;
  });
  const pdf = renderSimplePdf(`Fakturaunderlag ${reportNo}`, [
    "Underlag för bottler att fakturera tappning. Inga priser.",
    `Datum: ${new Date().toLocaleDateString("sv-SE")}`,
    input.notes.trim() ? `Anteckning: ${input.notes.trim()}` : "",
    "",
    ...pdfLines,
    "",
    `Totalt: ${jobs.length} ordrar, ${qty.toLocaleString("sv-SE")} flaskor`,
    "",
    "Ingen pris- eller fakturainformation. Rapportnumret används som underlag mot Aqua.",
  ]);
  const storageKey = `bottler-invoices/${reportNo}.pdf`;
  await putLocalFile(storageKey, pdf);
  await prisma.document.create({
    data: {
      orderId: jobs[0]!.orderId,
      entityType: "BOTTLER_INVOICE",
      entityId: report.id,
      kind: "LOGISTICS",
      title: `Fakturaunderlag ${reportNo}`,
      storageKey,
    },
  });
  return report;
}
