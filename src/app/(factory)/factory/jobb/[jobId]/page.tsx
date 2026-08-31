import { notFound } from "next/navigation";
import { requireRole } from "@/server/rbac";
import { getJob } from "@/server/services/production.service";
import { factoryAction } from "@/actions";
import { FACTORY_JOB_LABELS, FACTORY_PRODUCTION_STEPS } from "@/domain/enums";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { Button, FileLink, LinkButton, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";

export default async function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const user = await requireRole(["FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]);
  const job = await getJob(jobId, user.role === "FACTORY" ? user.factoryId ?? undefined : undefined);
  if (!job) notFound();
  const item = job.order.items[0];
  const spec = specFromOrderItem({
    visualSpecJson: job.order.visualSpecJson,
    item,
    imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
  });
  const addr = job.order.shippingAddress;
  const waybill = job.order.shipments.find((s) => s.type === "GOODS_TO_CUSTOMER");
  const needsDeadline = !job.order.factoryDeadlineAccepted && job.order.currentStatus === "CONFIRMED";
  const canStart =
    Boolean(job.order.factoryDeadlineAccepted) &&
    (job.status === "ACCEPTED" || job.order.currentStatus === "CONFIRMED") &&
    job.order.currentStatus === "CONFIRMED";
  const canFinish =
    (job.status === "STARTED" || job.order.currentStatus === "IN_PRODUCTION") && job.status !== "DONE";
  const canShip = job.order.currentStatus === "READY_TO_SHIP" && Boolean(waybill);
  const artworkFiles = job.order.designs.flatMap((d) => d.files);
  const finalFiles = job.order.artworkVersions.map((version) => ({
    version,
    file: artworkFiles.find((f) => f.storageKey === version.storageKey) ?? null,
  }));
  const stepIdx = FACTORY_PRODUCTION_STEPS.findIndex((s) => (s.statuses as readonly string[]).includes(job.status));

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader title={job.order.customer.name} subtitle={job.order.orderNo} />
      {spec ? <VisualSpecCard spec={spec} /> : null}
      <Panel>
        <StatusChip status={job.status} label={FACTORY_JOB_LABELS[job.status] ?? job.status} />
        <ol className="mt-4 flex items-center gap-2 text-sm">
          {FACTORY_PRODUCTION_STEPS.map((s, i) => (
            <li key={s.id} className="flex items-center gap-2">
              {i > 0 ? <span className="text-[#d4d4d8]">→</span> : null}
              <span className={i === stepIdx ? "font-semibold text-[var(--av-text)]" : "text-[var(--av-text-muted)]"}>{s.label}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm">
          Antal: <span className="font-semibold tabular-nums">{item?.qty?.toLocaleString("sv-SE") ?? "–"} st</span>
        </p>
        <p className="mt-2 text-sm">
          Senaste utskick: {job.order.factoryDeadline ?? "–"}{" "}
          {job.order.factoryDeadlineAccepted ? "(accepterad)" : ""}
        </p>
        {job.order.factoryIssueNote ? (
          <p className="mt-2 text-sm text-[var(--av-status-blocked-fg)]">{job.order.factoryIssueNote}</p>
        ) : null}
        <p className="mt-3 text-sm font-medium">Kund: {job.order.customer.name}</p>
        <p className="mt-1 text-sm">
          Leverans: {addr.line1}, {addr.postalCode} {addr.city}
        </p>
        <div className="mt-4 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--av-text-muted)]">Slutgiltig tryckfil</p>
          {finalFiles.length === 0 ? (
            <p className="text-sm text-[var(--av-text-muted)]">Ingen slutgiltig tryckfil ännu.</p>
          ) : (
            finalFiles.map(({ version, file }) =>
              file ? (
                <p key={version.id} className="text-sm">
                  <FileLink href={`/api/artwork-files/${file.id}`}>{version.title}</FileLink>
                </p>
              ) : (
                <p key={version.id} className="text-sm font-medium">
                  {version.title}
                </p>
              ),
            )
          )}
        </div>
        {job.order.documents.map((d) => (
          <p key={d.id} className="mt-1 text-sm">
            <FileLink href={`/api/documents/${d.id}`}>{d.title}</FileLink>
          </p>
        ))}
        <div className="mt-6 space-y-3">
          {needsDeadline ? (
            <>
              <FactoryBtn jobId={job.id} action="ACCEPT_DEADLINE" label="Acceptera deadline" />
              <form action={factoryAction} className="space-y-2">
                <input type="hidden" name="jobId" value={job.id} />
                <input type="hidden" name="action" value="FLAG_ISSUE" />
                <input
                  name="issueNote"
                  placeholder="Föreslaget datum / anledning"
                  className="h-12 w-full rounded-xl border border-[var(--av-border-strong)] px-3 text-sm"
                />
                <Button type="submit" variant="secondary" size="lg" className="w-full">
                  Flagga problem
                </Button>
              </form>
            </>
          ) : null}
          {canStart ? (
            <FactoryBtn jobId={job.id} action="START" label="Starta produktion" />
          ) : null}
          {canFinish && job.status !== "DONE" ? (
            <form action={factoryAction} className="space-y-2">
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="action" value="DONE" />
              <input name="readyDate" type="date" className="h-12 w-full rounded-xl border border-[var(--av-border-strong)] px-3 text-sm" />
              <Button type="submit" size="lg" className="w-full">
                Produktion klar + estimerat datum
              </Button>
            </form>
          ) : null}
          {waybill ? (
            <LinkButton href={`/factory/jobb/${job.id}/fraktsedel`} size="lg" className="w-full">
              Ladda ner fraktsedel
            </LinkButton>
          ) : job.order.currentStatus === "READY_TO_SHIP" ? (
            <p className="text-sm text-[var(--av-text-muted)]">Väntar på att Aqua skapar fraktsedel.</p>
          ) : null}
          {canShip ? <FactoryBtn jobId={job.id} action="SHIPPED" label="Markera skickad" /> : null}
        </div>
      </Panel>
    </div>
  );
}

function FactoryBtn({ jobId, action, label }: { jobId: string; action: string; label: string }) {
  return (
    <form action={factoryAction}>
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="action" value={action} />
      <Button type="submit" size="lg" className="w-full">
        {label}
      </Button>
    </form>
  );
}
