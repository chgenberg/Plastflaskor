import { notFound } from "next/navigation";
import { requireRole } from "@/server/rbac";
import { getJob } from "@/server/services/production.service";
import { factoryAction } from "@/actions";
import { Button, FileLink, LinkButton, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";

export default async function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const user = await requireRole(["FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]);
  const job = await getJob(jobId, user.role === "FACTORY" ? user.factoryId ?? undefined : undefined);
  if (!job) notFound();
  const item = job.order.items[0];
  const received = Boolean(job.order.label?.receivedAt);
  const opt = JSON.parse(item?.variant.optionsJson || "{}") as { waterType?: string; cap?: string };
  const volume = item?.variant.volumeMl ? `${item.variant.volumeMl / 10} cl` : item?.variant.name;
  const waybillReady = job.status === "DONE" && job.order.currentStatus === "PRODUCTION_DONE";
  const shippedReady = job.order.currentStatus === "WAYBILL_CREATED";

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <PageHeader title={`${item?.qty} × ${volume}`} subtitle={job.order.orderNo} />
      <Panel>
        <StatusChip status={job.status} label={job.status} />
        <p className="mt-4 text-sm text-[#6b7280]">
          {[opt.waterType, opt.cap, item?.variant.product.name].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-2 text-sm">Design: {job.order.designs[0]?.projectName ?? "–"}</p>
        <p className="text-sm">Etikett: {job.order.label ? `${job.order.label.qty} st · ${job.order.label.status}` : "–"}</p>
        <p className="mt-2 text-sm">
          {job.order.shippingAddress.line1}, {job.order.shippingAddress.city}
        </p>
        <p className="mt-2 text-sm">Etikett mottagen: {received ? "Ja" : "Nej"}</p>
        <p className="text-sm">Leverans: {job.order.requestedDate ?? "–"}</p>
        {job.order.documents.length > 0 ? (
          <ul className="mt-4 space-y-1 text-sm">
            {job.order.documents.map((d) => (
              <li key={d.id}>
                <FileLink href={`/api/documents/${d.id}`}>{d.title}</FileLink>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-6 space-y-3">
          {!received ? (
            <FactoryBtn jobId={job.id} action="LABELS_RECEIVED_BY_FACTORY" label="Mottag etikett" variant="secondary" />
          ) : null}
          {received && (job.status === "NOT_PLANNED" || job.status === "PLANNED") ? (
            <FactoryBtn jobId={job.id} action="PRODUCTION_STARTED" label="Starta produktion" />
          ) : null}
          {job.status === "STARTED" ? <FactoryBtn jobId={job.id} action="BOTTLES_FILLED" label="Markera fylld" /> : null}
          {job.status === "FILLED" ? <FactoryBtn jobId={job.id} action="LABELS_APPLIED" label="Etiketter applicerade" /> : null}
          {job.status === "LABELS_APPLIED" ? <FactoryBtn jobId={job.id} action="PRODUCTION_DONE" label="Produktion klar" /> : null}
          {waybillReady ? (
            <LinkButton href={`/factory/jobb/${job.id}/fraktsedel`} size="lg" className="w-full">
              Skriv ut fraktsedel
            </LinkButton>
          ) : null}
          {shippedReady ? <FactoryBtn jobId={job.id} action="SHIPPED_TO_END_CUSTOMER" label="Markera skickad" /> : null}
        </div>
      </Panel>
    </div>
  );
}

function FactoryBtn({
  jobId,
  action,
  label,
  variant = "primary",
  disabled,
}: {
  jobId: string;
  action: string;
  label: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  return (
    <form action={factoryAction}>
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="action" value={action} />
      <Button type="submit" variant={variant} size="lg" className="w-full" disabled={disabled}>
        {label}
      </Button>
    </form>
  );
}
