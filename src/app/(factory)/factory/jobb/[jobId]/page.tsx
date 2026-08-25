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

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <PageHeader title={`${item?.qty} × ${volume}`} subtitle={job.order.orderNo} />
      <Panel>
        <StatusChip status={job.status} label={job.status} />
        <p className="mt-4 text-sm text-[#6b7280]">
          {[opt.waterType, opt.cap, item?.variant.product.name].filter(Boolean).join(" · ")}
        </p>
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
            <form action={factoryAction}>
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="action" value="LABELS_RECEIVED_BY_FACTORY" />
              <Button type="submit" variant="secondary" size="lg" className="w-full">
                Mottag etikett
              </Button>
            </form>
          ) : null}
          {job.status !== "STARTED" && job.status !== "DONE" ? (
            <form action={factoryAction}>
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="action" value="PRODUCTION_STARTED" />
              <Button type="submit" size="lg" className="w-full" disabled={!received}>
                Starta
              </Button>
            </form>
          ) : null}
          {job.status === "STARTED" ? (
            <form action={factoryAction}>
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="action" value="PRODUCTION_DONE" />
              <Button type="submit" size="lg" className="w-full">
                Klar
              </Button>
            </form>
          ) : null}
          {job.status === "DONE" ? (
            <LinkButton href={`/factory/jobb/${job.id}/fraktsedel`} size="lg" className="w-full">
              Fraktsedel
            </LinkButton>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
