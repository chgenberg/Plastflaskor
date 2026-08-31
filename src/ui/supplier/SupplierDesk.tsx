import { factoryAction } from "@/actions";
import { FACTORY_JOB_LABELS } from "@/domain/enums";
import { formatShipAddress, labelSpecForVolume } from "@/domain/bottleCatalog";
import { parseVisualSpec, visualSpecFromOptions } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { ActionCard, Button, EmptyState, FileLink, LinkButton, PageHeader, StatusChip } from "@/ui/shell/primitives";

type Job = Awaited<ReturnType<typeof import("@/server/services/production.service").listJobsForFactory>>[number];

export type SupplierKind = "label" | "bottler";

function jobVisible(job: Job, kind: SupplierKind) {
  const status = job.order.currentStatus;
  if (kind === "label") {
    return ["CONFIRMED", "LABEL_PRODUCTION", "LABELS_DISPATCHED"].includes(status);
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
}: {
  jobs: Job[];
  kind: SupplierKind;
  basePath: "/labels" | "/bottler";
  missingFactory?: boolean;
}) {
  const title = kind === "label" ? "Etikettproducent" : "Bottler";
  const visible = jobs.filter((j) => jobVisible(j, kind) && j.order.currentStatus !== "SHIPPED");
  const shipped = jobs.filter((j) => j.order.currentStatus === "SHIPPED");

  if (missingFactory) {
    return (
      <div className="space-y-5">
        <PageHeader title="Översikt" subtitle={`${title} — ingen pris- eller fakturainformation.`} />
        <EmptyState title="Ingen leverantör kopplad" body="Logga in som etikett eller bottler för att se jobb." />
      </div>
    );
  }

  const accept = visible.filter(
    (j) =>
      !j.order.factoryDeadlineAccepted &&
      (j.order.currentStatus === "CONFIRMED" || j.order.currentStatus === "LABEL_PRODUCTION"),
  ).length;
  const inbound = visible.filter((j) => j.order.currentStatus === "LABELS_DISPATCHED").length;
  const ready = visible.filter((j) => j.order.currentStatus === "READY_TO_SHIP").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vad behöver du göra nu?"
        subtitle={`${title} — ingen pris- eller fakturainformation.`}
      />
      {kind === "bottler" && shipped.length > 0 ? (
        <p className="text-sm">
          <LinkButton href={`${basePath}/skickat`} variant="secondary">
            Skickade ({shipped.length})
          </LinkButton>
        </p>
      ) : null}
      {accept > 0 || inbound > 0 || ready > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {accept > 0 ? <ActionCard href={basePath} label="Sista skickdatum att acceptera" value={accept} tone="yellow" /> : null}
          {inbound > 0 && kind === "bottler" ? (
            <ActionCard href={basePath} label="Etiketter att ta emot" value={inbound} tone="yellow" />
          ) : null}
          {ready > 0 && kind === "bottler" ? (
            <ActionCard href={basePath} label="Fraktsedel / markera skickad" value={ready} tone="grey" />
          ) : null}
        </div>
      ) : null}
      <h2 className="pt-2 text-[15px] font-semibold tracking-tight">Beställningar</h2>
      {visible.length === 0 ? (
        <EmptyState
          title="Inga beställningar just nu"
          body={kind === "label" ? "När Aqua skickat en orderbekräftelse syns etikettjobben här." : "När etiketterna är skickade syns flaskjobben här."}
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {visible.map((j) => (
            <SupplierJobCard key={j.id} job={j} kind={kind} basePath={basePath} />
          ))}
        </div>
      )}
    </div>
  );
}

function SupplierJobCard({ job: j, kind, basePath }: { job: Job; kind: SupplierKind; basePath: string }) {
  const item = j.order.items[0];
  const spec =
    parseVisualSpec(j.order.visualSpecJson) ??
    (item
      ? visualSpecFromOptions({
          productName: item.variant.product.name,
          qty: item.qty,
          volumeMl: item.variant.volumeMl,
          optionsJson: item.variant.optionsJson,
          imageSrc: imageForProduct(item.variant.product.slug),
        })
      : null);
  const addr = j.order.shippingAddress;
  const waybill = j.order.shipments.find((s) => s.type === "GOODS_TO_CUSTOMER");
  const labelShip = j.order.shipments.find((s) => s.type === "LABELS_TO_FACTORY");
  const canShip = kind === "bottler" && j.order.currentStatus === "READY_TO_SHIP" && Boolean(waybill);
  const needsDeadline =
    !j.order.factoryDeadlineAccepted &&
    (j.order.currentStatus === "CONFIRMED" || j.order.currentStatus === "LABEL_PRODUCTION");
  const canDispatch =
    kind === "label" &&
    j.order.factoryDeadlineAccepted &&
    j.order.currentStatus === "LABEL_PRODUCTION";
  const canReceive = kind === "bottler" && j.order.currentStatus === "LABELS_DISPATCHED";
  const canEstimate =
    kind === "bottler" &&
    ["LABELS_RECEIVED", "PRODUCTION_SCHEDULED", "IN_PRODUCTION"].includes(j.order.currentStatus) &&
    !j.order.aquaApprovedDelivery;
  const canStart =
    kind === "bottler" &&
    (j.order.currentStatus === "LABELS_RECEIVED" || j.order.currentStatus === "PRODUCTION_SCHEDULED");
  const canFinish =
    kind === "bottler" &&
    (j.status === "STARTED" || j.order.currentStatus === "IN_PRODUCTION") &&
    j.status !== "DONE";
  const qty = item?.qty;
  const labelSpec = labelSpecForVolume(item?.variant.volumeMl);
  const bottlerShip = formatShipAddress(j.order.factory?.address) ?? j.order.factory?.name;
  const artworkFiles = j.order.designs.flatMap((d) => d.files);
  const finalFiles = j.order.artworkVersions.map((version) => ({
    version,
    file: artworkFiles.find((f) => f.storageKey === version.storageKey) ?? null,
  }));
  const artworkDocs = j.order.documents.filter((d) => d.kind === "ARTWORK");

  return (
    <article className="av-card flex flex-col p-5">
      <p className="av-mono text-[13px] text-[var(--av-text-muted)]">{j.order.orderNo}</p>
      <h2 className="mt-1 text-[18px] font-semibold tracking-tight">{j.order.customer.name}</h2>
      {spec ? (
        <div className="mt-4">
          <VisualSpecCard spec={spec} />
        </div>
      ) : null}
      <p className="mt-3 text-sm">
        {kind === "label" ? "Antal etiketter" : "Antal"}:{" "}
        <span className="font-semibold tabular-nums">{qty != null ? `${qty.toLocaleString("sv-SE")} st` : "–"}</span>
      </p>
      {kind === "label" ? (
        <dl className="mt-3 space-y-1 text-sm">
          <p>Produkt: {item?.variant.product.name ?? "–"}</p>
          <p>Etikettformat: {labelSpec.format}</p>
          <p>Material: {labelSpec.material}</p>
          <p>Bottler: {j.order.factory?.name ?? "–"}</p>
          <p>Leveransadress till bottler: {bottlerShip ?? "–"}</p>
        </dl>
      ) : null}
      <div className="mt-2 space-y-1">
        <p className="av-label">Slutgiltig artwork</p>
        {finalFiles.length === 0 && artworkDocs.length === 0 ? (
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
            {artworkDocs.map((d) => (
              <p key={d.id} className="text-sm">
                <FileLink href={`/api/documents/${d.id}`}>{d.title}</FileLink>
              </p>
            ))}
          </>
        )}
      </div>
      {kind === "bottler" ? (
        <p className="mt-3 text-sm">
          Leverans till kund: {addr ? `${addr.line1}, ${addr.postalCode} ${addr.city}` : "–"}
        </p>
      ) : null}
      {labelShip ? (
        <p className="mt-1 text-sm">
          Etikettfrakt: {labelShip.trackingNo ?? "–"} ({labelShip.status})
        </p>
      ) : null}
      <p className="mt-1 text-sm">
        Sista skickdatum: {j.order.factoryDeadline ?? "–"} {j.order.factoryDeadlineAccepted ? "(accepterad)" : ""}
      </p>
      {j.order.factoryIssueNote ? (
        <p className="mt-1 text-sm text-[var(--av-status-blocked-fg)]">{j.order.factoryIssueNote}</p>
      ) : null}
      <div className="mt-3">
        <StatusChip status={j.status} label={FACTORY_JOB_LABELS[j.status] ?? j.status} />
      </div>
      <div className="mt-4 space-y-2">
        {needsDeadline && kind === "label" ? (
          <>
            <form action={factoryAction}>
              <input type="hidden" name="jobId" value={j.id} />
              <input type="hidden" name="action" value="ACCEPT_DEADLINE" />
              <Button type="submit" size="lg" className="w-full">
                Acceptera sista skickdatum
              </Button>
            </form>
            <form action={factoryAction} className="space-y-2">
              <input type="hidden" name="jobId" value={j.id} />
              <input type="hidden" name="action" value="FLAG_ISSUE" />
              <input
                name="issueNote"
                placeholder="Föreslaget datum / anledning"
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
            <input type="hidden" name="jobId" value={j.id} />
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
        {canReceive ? (
          <form action={factoryAction}>
            <input type="hidden" name="jobId" value={j.id} />
            <input type="hidden" name="action" value="RECEIVE_LABELS" />
            <Button type="submit" size="lg" className="w-full">
              Etiketter mottagna
            </Button>
          </form>
        ) : null}
        {canEstimate ? (
          <form action={factoryAction} className="space-y-2">
            <input type="hidden" name="jobId" value={j.id} />
            <input type="hidden" name="action" value="ESTIMATE_DATE" />
            <input
              name="readyDate"
              type="date"
              defaultValue={j.order.factoryReadyEstimate ?? ""}
              required
              className="h-12 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-3 text-sm"
            />
            <Button type="submit" size="lg" className="w-full">
              Ange estimerat klart-datum
            </Button>
          </form>
        ) : null}
        {canStart ? (
          <form action={factoryAction}>
            <input type="hidden" name="jobId" value={j.id} />
            <input type="hidden" name="action" value="START" />
            <Button type="submit" size="lg" className="w-full">
              Starta produktion
            </Button>
          </form>
        ) : null}
        {canFinish ? (
          <form action={factoryAction} className="space-y-2">
            <input type="hidden" name="jobId" value={j.id} />
            <input type="hidden" name="action" value="DONE" />
            <input
              name="readyDate"
              type="date"
              className="h-12 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-3 text-sm"
            />
            <Button type="submit" size="lg" className="w-full">
              Produktion klar + estimerat datum
            </Button>
          </form>
        ) : null}
        {waybill && kind === "bottler" ? (
          <LinkButton href={`${basePath}/jobb/${j.id}/fraktsedel`} size="lg" className="w-full">
            Ladda ner fraktsedel
          </LinkButton>
        ) : null}
        {canShip ? (
          <form action={factoryAction}>
            <input type="hidden" name="jobId" value={j.id} />
            <input type="hidden" name="action" value="SHIPPED" />
            <Button type="submit" size="lg" className="w-full">
              Markera skickad
            </Button>
          </form>
        ) : null}
        <LinkButton href={`${basePath}/jobb/${j.id}`} variant="secondary" size="lg" className="w-full">
          Öppna jobb
        </LinkButton>
      </div>
    </article>
  );
}
