import { requireRole } from "@/server/rbac";
import { listJobsForFactory } from "@/server/services/production.service";
import { factoryAction } from "@/actions";
import { FACTORY_JOB_LABELS } from "@/domain/enums";
import { parseVisualSpec, visualSpecFromOptions } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { ActionCard, Button, EmptyState, FileLink, KpiCard, LinkButton, PageHeader, StatusChip } from "@/ui/shell/primitives";

export default async function FactoryHome() {
  const user = await requireRole(["FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]);
  const scoped = user.role === "FACTORY";
  const jobs =
    scoped && !user.factoryId ? [] : await listJobsForFactory(scoped ? user.factoryId ?? undefined : undefined);
  const today = jobs.filter((j) => j.order.currentStatus !== "SHIPPED" && j.order.currentStatus !== "DELIVERED");

  if (scoped && !user.factoryId) {
    return (
      <div className="space-y-5">
        <PageHeader title="Översikt" subtitle="Leverantörsportal — demo. Inga priser eller fakturor." />
        <EmptyState title="Ingen tryckeri kopplat" body="Logga in som leverantör för att se beställningar." />
      </div>
    );
  }

  const accept = today.filter((j) => j.order.currentStatus === "CONFIRMED" && !j.order.factoryDeadlineAccepted).length;
  const inProd = today.filter((j) => j.order.currentStatus === "IN_PRODUCTION").length;
  const ready = today.filter((j) => j.order.currentStatus === "READY_TO_SHIP").length;
  const shipped = jobs.filter((j) => j.order.currentStatus === "SHIPPED").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Översikt"
        subtitle="Demo för leverantör — beställningar och produktion. Inga priser eller fakturor."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Att acceptera" value={accept} />
        <KpiCard label="I produktion" value={inProd} />
        <KpiCard label="Redo att skicka" value={ready} />
        <KpiCard label="Skickade" value={shipped} href="/factory/skickat" />
      </div>
      {accept > 0 || ready > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {accept > 0 ? (
            <ActionCard href="/factory" label="Deadline att acceptera" value={accept} tone="yellow" />
          ) : null}
          {ready > 0 ? (
            <ActionCard href="/factory" label="Fraktsedel / markera skickad" value={ready} tone="grey" />
          ) : null}
        </div>
      ) : null}
      <h2 className="pt-2 text-[15px] font-semibold tracking-tight">Beställningar</h2>
      {today.length === 0 ? (
        <EmptyState title="Inga beställningar just nu" body="När Aqua skickat en bekräftad muggorder syns jobben här." />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {today.map((j) => {
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
            const canShip = j.order.currentStatus === "READY_TO_SHIP" && Boolean(waybill);
            const needsDeadline = !j.order.factoryDeadlineAccepted && j.order.currentStatus === "CONFIRMED";
            const canStart =
              Boolean(j.order.factoryDeadlineAccepted) &&
              (j.status === "ACCEPTED" || j.order.currentStatus === "CONFIRMED") &&
              j.order.currentStatus === "CONFIRMED";
            const canFinish =
              (j.status === "STARTED" || j.order.currentStatus === "IN_PRODUCTION") && j.status !== "DONE";
            const qty = item?.qty;
            const artworkFiles = j.order.designs.flatMap((d) => d.files);
            const finalFiles = j.order.artworkVersions.map((version) => ({
              version,
              file: artworkFiles.find((f) => f.storageKey === version.storageKey) ?? null,
            }));
            const artworkDocs = j.order.documents.filter((d) => d.kind === "ARTWORK");
            return (
              <article key={j.id} className="av-card flex flex-col p-5">
                <p className="av-mono text-[13px] text-[var(--av-text-muted)]">{j.order.orderNo}</p>
                <h2 className="mt-1 text-[18px] font-semibold tracking-tight">{j.order.customer.name}</h2>
                {spec ? <div className="mt-4"><VisualSpecCard spec={spec} /></div> : null}
                <p className="mt-3 text-sm">
                  Antal:{" "}
                  <span className="font-semibold tabular-nums">
                    {qty != null ? `${qty.toLocaleString("sv-SE")} st` : "–"}
                  </span>
                </p>
                <div className="mt-2 space-y-1">
                  <p className="av-label">Slutgiltig tryckfil</p>
                  {finalFiles.length === 0 && artworkDocs.length === 0 ? (
                    <p className="text-sm text-[var(--av-text-muted)]">Ingen slutgiltig tryckfil ännu.</p>
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
                <p className="mt-3 text-sm">
                  Leverans: {addr.line1}, {addr.postalCode} {addr.city}
                </p>
                <p className="mt-1 text-sm">
                  Senaste utskick: {j.order.factoryDeadline ?? "–"}{" "}
                  {j.order.factoryDeadlineAccepted ? "(accepterad)" : ""}
                </p>
                {j.order.factoryIssueNote ? (
                  <p className="mt-1 text-sm text-[var(--av-status-blocked-fg)]">{j.order.factoryIssueNote}</p>
                ) : null}
                <div className="mt-3">
                  <StatusChip status={j.status} label={FACTORY_JOB_LABELS[j.status] ?? j.status} />
                </div>
                <div className="mt-4 space-y-2">
                  {needsDeadline ? (
                    <>
                      <form action={factoryAction}>
                        <input type="hidden" name="jobId" value={j.id} />
                        <input type="hidden" name="action" value="ACCEPT_DEADLINE" />
                        <Button type="submit" size="lg" className="w-full">
                          Acceptera deadline
                        </Button>
                      </form>
                      <form action={factoryAction} className="space-y-2">
                        <input type="hidden" name="jobId" value={j.id} />
                        <input type="hidden" name="action" value="FLAG_ISSUE" />
                        <label className="sr-only" htmlFor={`issue-${j.id}`}>
                          Föreslaget datum eller anledning
                        </label>
                        <input
                          id={`issue-${j.id}`}
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
                      <label className="sr-only" htmlFor={`ready-${j.id}`}>
                        Estimerat klart-datum
                      </label>
                      <input id={`ready-${j.id}`} name="readyDate" type="date" className="h-12 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-3 text-sm" />
                      <Button type="submit" size="lg" className="w-full">
                        Produktion klar + estimerat datum
                      </Button>
                    </form>
                  ) : null}
                  {waybill ? (
                    <LinkButton href={`/factory/jobb/${j.id}/fraktsedel`} size="lg" className="w-full">
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
                  <LinkButton href={`/factory/jobb/${j.id}`} variant="secondary" size="lg" className="w-full">
                    Öppna jobb
                  </LinkButton>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
