import { labelStockLabel } from "@/domain/bottleCatalog";
import type { InboundDispatchCard, LabelDispatchSummary } from "@/server/services/labelDispatch.service";
import { bottlerDeskStatus } from "@/domain/bottlerDesk";
import { planFromItem } from "@/domain/bottlerPlan";
import { hintFactsFromOrder, statusHint } from "@/domain/statusHint";
import { supplierActionLabel, supplierCounts, supplierNeedsAttention } from "@/domain/supplierDesk";
import { LabelJobsTable } from "@/ui/supplier/LabelJobsTable";
import { BottlerJobsTable } from "@/ui/supplier/BottlerJobsTable";
import { Reveal } from "@/ui/motion/Reveal";
import { DashPage, EmptyState, KpiCard, KpiStrip, LinkButton, NeedsAttention, PageHeader, SectionTitle } from "@/ui/shell/primitives";

type Job = Awaited<ReturnType<typeof import("@/server/services/production.service").listJobsForFactory>>[number];

export type SupplierKind = "label" | "bottler";

function jobVisible(job: Job, kind: SupplierKind) {
  const status = job.order.currentStatus;
  if (kind === "label") {
    return ["CONFIRMED", "LABEL_PRODUCTION"].includes(status);
  }
  return [
    "LABELS_DISPATCHED",
    "LABELS_RECEIVED",
    "PRODUCTION_SCHEDULED",
    "IN_PRODUCTION",
    "READY_TO_SHIP",
    "SHIPPED",
  ].includes(status);
}

export function SupplierDesk({
  jobs,
  kind,
  basePath,
  missingFactory,
  composeReport = false,
  highlightReport = null,
  reports = [],
  inboundReports = [],
  receivedReport = null,
}: {
  jobs: Job[];
  kind: SupplierKind;
  basePath: "/labels" | "/bottler";
  missingFactory?: boolean;
  composeReport?: boolean;
  highlightReport?: string | null;
  reports?: LabelDispatchSummary[];
  inboundReports?: InboundDispatchCard[];
  receivedReport?: string | null;
}) {
  const title = kind === "label" ? "Etikettproducent" : "Bottler";
  const visible = jobs.filter((j) => jobVisible(j, kind) && j.order.currentStatus !== "SHIPPED");
  const shipped = jobs.filter((j) => j.order.currentStatus === "SHIPPED");

  if (missingFactory) {
    return (
      <DashPage>
        <PageHeader title="Översikt" subtitle={`${title} — ingen pris- eller fakturainformation.`} />
        <EmptyState title="Ingen leverantör kopplad" body="Logga in som etikett eller bottler för att se jobb." />
      </DashPage>
    );
  }

  const reportByJob = new Map(reports.flatMap((r) => r.jobIds.map((id) => [id, r.reportNo] as const)));
  const highlighted = highlightReport ? reports.find((r) => r.reportNo === highlightReport) : null;
  const counts = supplierCounts(visible, shipped, kind);
  const attention = [
    ...inboundReports.map((r) => ({
      key: r.reportNo,
      href: `/bottler/inleverans/${encodeURIComponent(r.reportNo)}`,
      label: "Etiketter att ta emot",
      detail: `${r.orderCount} ordrar · ${r.qty.toLocaleString("sv-SE")} etiketter`,
    })),
    ...visible
      .filter((j) => supplierNeedsAttention(kind, j))
      .map((j) => ({
        key: j.id,
        href: `${basePath}/jobb/${j.id}`,
        label: `${j.order.orderNo} · ${supplierActionLabel(kind, j)}`,
      })),
  ];

  return (
    <DashPage>
      <PageHeader
        title="Vad behöver du göra nu?"
        subtitle={`${title} — ingen pris- eller fakturainformation.`}
        action={
          kind === "bottler" && shipped.length > 0 ? (
            <LinkButton href={`${basePath}/skickat`} variant="secondary" size="sm">
              Skickade ({shipped.length})
            </LinkButton>
          ) : undefined
        }
      />
      <Reveal>
        <KpiStrip>
          <KpiCard href={`${basePath}?f=nya`} label="Nya jobb att acceptera" value={counts.toAccept} />
          <KpiCard href={`${basePath}?f=pagaende`} label="Pågående" value={counts.active} />
          <KpiCard href={`${basePath}?f=vecka`} label="Deadline denna vecka" value={counts.dueThisWeek} />
          <KpiCard href={kind === "bottler" ? `${basePath}/skickat` : `${basePath}?lage=rapport`} label="Skickat" value={counts.shipped} />
        </KpiStrip>
      </Reveal>
      <NeedsAttention items={attention} />
      {receivedReport ? (
        <div className="av-card px-4 py-3 text-[13px]">
          <p className="font-semibold text-[var(--av-status-done-fg)]">{receivedReport} inlevererad</p>
        </div>
      ) : null}
      {highlighted ? (
        <div className="av-card px-4 py-3 text-[13px]">
          <p className="font-semibold text-[var(--av-status-done-fg)]">
            {highlighted.reportNo} skapad
          </p>
          <p className="mt-1 tabular-nums text-[var(--av-text-secondary)]">
            {highlighted.orderCount} ordrar · {highlighted.qty.toLocaleString("sv-SE")} etiketter · tracking{" "}
            {highlighted.trackingNo}
          </p>
          {highlighted.documentId ? (
            <p className="mt-2">
              <LinkButton href={`/api/documents/${highlighted.documentId}`} variant="secondary" size="sm">
                Öppna underlag
              </LinkButton>
            </p>
          ) : null}
        </div>
      ) : null}
      <SectionTitle>Beställningar</SectionTitle>
      {visible.length === 0 ? (
        <EmptyState
          title="Inga beställningar just nu"
          body={kind === "label" ? "När Aqua skickat en orderbekräftelse syns etikettjobben här." : "När etiketterna är skickade syns flaskjobben här."}
        />
      ) : kind === "label" ? (
        <LabelJobsTable
          compose={composeReport}
          highlightReport={highlightReport}
          rows={visible.map((j) => {
            const item = j.order.items[0];
            const status = j.order.currentStatus;
            return {
              id: j.id,
              href: `${basePath}/jobb/${j.id}`,
              orderNo: j.order.orderNo,
              orderName: j.order.customer.name,
              material: labelStockLabel({
                visualSpecJson: j.order.visualSpecJson ?? item?.visualSpecJson,
                optionsJson: item?.variant.optionsJson,
              }),
              deadline: j.order.factoryDeadline,
              qty: j.order.items.reduce((sum, line) => sum + line.qty, 0),
              canMarkReady:
                !j.order.factoryDeadlineAccepted &&
                (status === "CONFIRMED" || status === "LABEL_PRODUCTION"),
              canSelect: status === "CONFIRMED" || status === "LABEL_PRODUCTION",
              reportNo: reportByJob.get(j.id) ?? null,
              actionLabel: supplierActionLabel("label", j),
            };
          })}
        />
      ) : (
        <BottlerJobsTable
          rows={visible.map((j) => {
            const item = j.order.items[0];
            const plan = planFromItem({
              volumeMl: item?.variant.volumeMl,
              visualSpecJson: j.order.visualSpecJson ?? item?.visualSpecJson,
              optionsJson: item?.variant.optionsJson,
              productName: item?.variant.product.name,
            });
            const lane = bottlerDeskStatus({ jobStatus: j.status, orderStatus: j.order.currentStatus });
            return {
              id: j.id,
              href: `${basePath}/jobb/${j.id}`,
              orderNo: j.order.orderNo,
              customer: j.order.customer.name,
              product: item?.variant.product.name ?? "–",
              qty: item?.qty ?? 0,
              deadline: j.order.factoryDeadline,
              deadlineAccepted: j.order.factoryDeadlineAccepted,
              ...lane,
              ...plan,
              statusLabel: statusHint(j.order.currentStatus, hintFactsFromOrder(j.order), "BOTTLER").label,
              actionLabel: supplierActionLabel("bottler", j),
            };
          })}
        />
      )}
    </DashPage>
  );
}
