import { notFound } from "next/navigation";
import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { getJob } from "@/server/services/production.service";
import { factoryAction } from "@/actions";
import { formatShipAddress, labelSpecForVolume } from "@/domain/bottleCatalog";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { Button, FileLink, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";
import { FACTORY_JOB_LABELS } from "@/domain/enums";

export default async function LabelJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const user = await requireSupplier("label");
  const job = await getJob(jobId, scopedFactoryId(user));
  if (!job) notFound();
  const item = job.order.items[0];
  const spec = specFromOrderItem({
    visualSpecJson: job.order.visualSpecJson,
    item,
    imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
  });
  const needsDeadline =
    !job.order.factoryDeadlineAccepted &&
    (job.order.currentStatus === "CONFIRMED" || job.order.currentStatus === "LABEL_PRODUCTION");
  const canDispatch = job.order.factoryDeadlineAccepted && job.order.currentStatus === "LABEL_PRODUCTION";
  const labelSpec = labelSpecForVolume(item?.variant.volumeMl);
  const bottlerShip = formatShipAddress(job.order.factory?.address) ?? job.order.factory?.name;
  const artworkFiles = job.order.designs.flatMap((d) => d.files);
  const finalFiles = job.order.artworkVersions.map((version) => ({
    version,
    file: artworkFiles.find((f) => f.storageKey === version.storageKey) ?? null,
  }));

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        title={job.order.orderNo}
        subtitle={`${job.order.customer.name}${item ? ` · ${item.variant.product.name}` : ""}`}
      />
      {spec ? <VisualSpecCard spec={spec} hero /> : null}
      <Panel>
        <StatusChip status={job.status} label={FACTORY_JOB_LABELS[job.status] ?? job.status} />
        <dl className="mt-4 space-y-2 text-sm">
          <p>
            Antal etiketter:{" "}
            <span className="font-semibold tabular-nums">{item?.qty?.toLocaleString("sv-SE") ?? "–"} st</span>
          </p>
          <p>Produkt: {item?.variant.product.name ?? "–"}</p>
          <p>Etikettformat: {labelSpec.format}</p>
          <p>Material: {labelSpec.material}</p>
          <p>Bottler: {job.order.factory?.name ?? "–"}</p>
          <p>Leveransadress till bottler: {bottlerShip ?? "–"}</p>
          <p>
            Sista skickdatum: {job.order.factoryDeadline ?? "–"}{" "}
            {job.order.factoryDeadlineAccepted ? "(accepterad)" : ""}
          </p>
        </dl>
        <div className="mt-4 space-y-1">
          <p className="av-label">Slutgiltig artwork</p>
          {finalFiles.length === 0 && job.order.documents.length === 0 ? (
            <p className="text-sm text-[var(--av-text-muted)]">Ingen slutgiltig artwork ännu.</p>
          ) : (
            <>
              {finalFiles.map(({ version, file }) =>
                file ? (
                  <p key={version.id} className="text-sm">
                    <FileLink href={`/api/artwork-files/${file.id}`}>{version.title}</FileLink>
                  </p>
                ) : (
                  <p key={version.id} className="text-sm font-medium">
                    {version.title}
                  </p>
                ),
              )}
              {job.order.documents.map((d) => (
                <p key={d.id} className="text-sm">
                  <FileLink href={`/api/documents/${d.id}`}>{d.title}</FileLink>
                </p>
              ))}
            </>
          )}
        </div>
        <div className="mt-6 space-y-3">
          {needsDeadline ? (
            <>
              <form action={factoryAction}>
                <input type="hidden" name="jobId" value={job.id} />
                <input type="hidden" name="action" value="ACCEPT_DEADLINE" />
                <Button type="submit" size="lg" className="w-full">
                  Acceptera sista skickdatum
                </Button>
              </form>
              <form action={factoryAction} className="space-y-2">
                <input type="hidden" name="jobId" value={job.id} />
                <input type="hidden" name="action" value="FLAG_ISSUE" />
                <input
                  name="issueNote"
                  placeholder="Föreslaget dispatchdatum / anledning"
                  className="h-12 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-3 text-sm"
                />
                <Button type="submit" variant="secondary" size="lg" className="w-full">
                  Flagga problem
                </Button>
              </form>
            </>
          ) : null}
          {canDispatch ? (
            <form action={factoryAction} className="space-y-2">
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="action" value="DISPATCH" />
              <input
                name="shippedDate"
                type="date"
                required
                className="h-12 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-3 text-sm"
              />
              <input
                name="carrier"
                placeholder="Transportör"
                required
                className="h-12 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-3 text-sm"
              />
              <input
                name="trackingNo"
                placeholder="Frakt- / trackingnummer"
                required
                className="h-12 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-3 text-sm"
              />
              <Button type="submit" size="lg" className="w-full">
                Bekräfta utskick till bottler
              </Button>
            </form>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
