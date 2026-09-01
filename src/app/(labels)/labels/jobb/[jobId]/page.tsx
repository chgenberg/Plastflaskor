import { notFound } from "next/navigation";
import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { getJob } from "@/server/services/production.service";
import { factoryAction } from "@/actions";
import { labelStockLabel } from "@/domain/bottleCatalog";
import { Button, DashPage, FileLink, LinkButton, PageHeader, Panel, controlClass } from "@/ui/shell/primitives";
import { SendToPrinterButton } from "@/ui/supplier/SendToPrinterButton";

export default async function LabelJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const user = await requireSupplier("label");
  const job = await getJob(jobId, scopedFactoryId(user), "label");
  if (!job) notFound();
  const item = job.order.items[0];
  const qty = job.order.items.reduce((sum, line) => sum + line.qty, 0);
  const material = labelStockLabel({
    visualSpecJson: job.order.visualSpecJson ?? item?.visualSpecJson,
    optionsJson: item?.variant.optionsJson,
  });
  const needsDeadline =
    !job.order.factoryDeadlineAccepted &&
    (job.order.currentStatus === "CONFIRMED" || job.order.currentStatus === "LABEL_PRODUCTION");
  const canDispatch = job.order.factoryDeadlineAccepted && job.order.currentStatus === "LABEL_PRODUCTION";
  const artworkFiles = job.order.designs.flatMap((d) => d.files);
  const finalFiles = job.order.artworkVersions.map((version) => ({
    version,
    file: artworkFiles.find((f) => f.storageKey === version.storageKey) ?? null,
  }));
  const preview =
    finalFiles.find((f) => f.file?.mimeType.startsWith("image/")) ?? finalFiles.find((f) => f.file) ?? null;
  const previewHref = preview?.file ? `/api/artwork-files/${preview.file.id}` : null;
  const previewIsImage = Boolean(preview?.file?.mimeType.startsWith("image/"));
  const artworkDoc = !previewHref ? job.order.documents.find((d) => d.kind === "ARTWORK") : null;

  return (
    <div className="mx-auto max-w-lg">
    <DashPage>
      <PageHeader
        title={job.order.orderNo}
        subtitle={job.order.customer.name}
      />
      <p>
        <LinkButton href="/labels" variant="ghost" size="sm">
          Tillbaka
        </LinkButton>
      </p>
      <Panel>
        <p className="av-label">Artwork</p>
        {previewHref && previewIsImage ? (
          <div className="mt-2 overflow-hidden rounded-[var(--av-radius-md)] border border-[var(--av-border)] bg-[var(--av-bg)]">
            {/* API-route, inte statisk asset */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${previewHref}?inline=1`}
              alt={preview?.version.title ?? "Artwork"}
              className="mx-auto max-h-[320px] w-full object-contain"
            />
          </div>
        ) : previewHref ? (
          <div className="mt-2 space-y-2">
            <iframe
              src={`${previewHref}?inline=1`}
              title={preview?.version.title ?? "Artwork"}
              className="h-64 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border)] bg-[var(--av-bg)]"
            />
            <p className="text-sm">
              <FileLink href={previewHref}>{preview?.version.title ?? "Öppna artwork"}</FileLink>
            </p>
          </div>
        ) : artworkDoc ? (
          <p className="mt-2 text-sm">
            <FileLink href={`/api/documents/${artworkDoc.id}`}>{artworkDoc.title}</FileLink>
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--av-text-muted)]">Ingen slutgiltig artwork ännu.</p>
        )}
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="av-label">Material</dt>
            <dd className="mt-1 font-semibold">{material}</dd>
          </div>
          <div>
            <dt className="av-label">Antal</dt>
            <dd className="mt-1 font-semibold tabular-nums">{qty.toLocaleString("sv-SE")} st</dd>
          </div>
        </dl>
        <div className="mt-6">
          <SendToPrinterButton />
        </div>
      </Panel>
      {needsDeadline || canDispatch ? (
        <Panel>
          <div className="space-y-3">
            {needsDeadline ? (
              <>
                <form action={factoryAction}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <input type="hidden" name="action" value="ACCEPT_DEADLINE" />
                  <Button type="submit" variant="secondary" size="lg" className="w-full">
                    Klara att skicka
                  </Button>
                </form>
                <form action={factoryAction} className="space-y-2">
                  <input type="hidden" name="jobId" value={job.id} />
                  <input type="hidden" name="action" value="FLAG_ISSUE" />
                  <input
                    name="issueNote"
                    placeholder="Föreslaget dispatchdatum / anledning"
                    className={controlClass}
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
                <input name="shippedDate" type="date" required className={controlClass} />
                <input name="carrier" placeholder="Transportör" required className={controlClass} />
                <input name="trackingNo" placeholder="Frakt- / trackingnummer" required className={controlClass} />
                <Button type="submit" variant="secondary" size="lg" className="w-full">
                  Bekräfta utskick till bottler
                </Button>
              </form>
            ) : null}
          </div>
        </Panel>
      ) : null}
    </DashPage>
    </div>
  );
}
