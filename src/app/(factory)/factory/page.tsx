import { requireRole } from "@/server/rbac";
import { listJobsForFactory } from "@/server/services/production.service";
import { factoryAction } from "@/actions";
import { FACTORY_JOB_LABELS } from "@/domain/enums";
import { parseVisualSpec, visualSpecFromOptions } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { Button, EmptyState, FileLink, LinkButton, PageHeader, StatusChip } from "@/ui/shell/primitives";

export default async function FactoryHome() {
  const user = await requireRole(["FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]);
  const scoped = user.role === "FACTORY";
  const jobs =
    scoped && !user.factoryId ? [] : await listJobsForFactory(scoped ? user.factoryId ?? undefined : undefined);
  const today = jobs.filter((j) => j.order.currentStatus !== "SHIPPED" && j.order.currentStatus !== "DELIVERED");

  if (scoped && !user.factoryId) {
    return (
      <div className="space-y-5">
        <PageHeader title="Produktion idag" subtitle="Muggjobb för tryckeriet." />
        <EmptyState title="Ingen tryckeri kopplat" body="Logga in som tryckeri för att se dagens muggjobb." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Produktion idag" subtitle={`${today.length} muggjobb`} />
      {today.length === 0 ? (
        <EmptyState title="Inga muggjobb idag" body="När Aqua skickat en bekräftad muggorder syns tryckjobben här." />
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
              <article key={j.id} className="flex flex-col rounded-[18px] bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,.04)]">
                <p className="font-mono text-[13px] text-[#6b7280]">{j.order.orderNo}</p>
                <h2 className="mt-1 text-[18px] font-semibold tracking-tight">{j.order.customer.name}</h2>
                {spec ? <div className="mt-3"><VisualSpecCard spec={spec} compact /></div> : null}
                <p className="mt-3 text-sm">
                  Antal:{" "}
                  <span className="font-semibold tabular-nums">
                    {qty != null ? `${qty.toLocaleString("sv-SE")} st` : "–"}
                  </span>
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">Slutgiltig tryckfil</p>
                  {finalFiles.length === 0 && artworkDocs.length === 0 ? (
                    <p className="text-sm text-[#6b7280]">Ingen slutgiltig tryckfil ännu.</p>
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
                        <input
                          name="issueNote"
                          placeholder="Föreslaget datum / anledning"
                          className="h-12 w-full rounded-xl border border-black/10 px-3 text-sm"
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
                      <input name="readyDate" type="date" className="h-12 w-full rounded-xl border border-black/10 px-3 text-sm" />
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
