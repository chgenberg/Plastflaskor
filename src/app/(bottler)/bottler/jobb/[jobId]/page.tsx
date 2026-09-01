import { notFound } from "next/navigation";
import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { getJob } from "@/server/services/production.service";
import { factoryAction } from "@/actions";
import { bottlerDeskStatus } from "@/domain/bottlerDesk";
import { formatShipAddress } from "@/domain/bottleCatalog";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { Button, DashPage, FileLink, LinkButton, PageHeader, Panel, StatusChip, controlClass } from "@/ui/shell/primitives";

export default async function BottlerJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const user = await requireSupplier("bottler");
  const job = await getJob(jobId, scopedFactoryId(user), "bottler");
  if (!job) notFound();
  const item = job.order.items[0];
  const spec = specFromOrderItem({
    visualSpecJson: job.order.visualSpecJson,
    item,
    imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
  });
  const addr = job.order.shippingAddress;
  const labelShip = job.order.shipments.find((s) => s.type === "LABELS_TO_FACTORY");
  const canReceive = job.order.currentStatus === "LABELS_DISPATCHED";
  const canEstimate =
    ["LABELS_RECEIVED", "PRODUCTION_SCHEDULED", "IN_PRODUCTION"].includes(job.order.currentStatus) &&
    !job.order.aquaApprovedDelivery;
  const canStart = job.order.currentStatus === "LABELS_RECEIVED" || job.order.currentStatus === "PRODUCTION_SCHEDULED";
  const canFinish = (job.status === "STARTED" || job.order.currentStatus === "IN_PRODUCTION") && job.status !== "DONE";
  const canShip =
    job.order.currentStatus !== "SHIPPED" &&
    (job.status === "DONE" || job.order.currentStatus === "READY_TO_SHIP");
  const lane = bottlerDeskStatus({ jobStatus: job.status, orderStatus: job.order.currentStatus });

  return (
    <div className="mx-auto max-w-lg">
    <DashPage>
      <PageHeader
        title={job.order.orderNo}
        subtitle={`${job.order.customer.name}${item ? ` · ${item.variant.product.name}` : ""}`}
      />
      {spec ? <VisualSpecCard spec={spec} hero /> : null}
      <Panel>
        <StatusChip status={lane.status} label={lane.statusLabel} />
        <dl className="mt-4 space-y-2 text-sm">
          <p>
            Antal: <span className="font-semibold tabular-nums">{item?.qty?.toLocaleString("sv-SE") ?? "–"} st</span>
          </p>
          <p>Produkt: {item?.variant.product.name ?? "–"}</p>
          <p>Leverans till kund: {formatShipAddress(addr) ?? "–"}</p>
          {labelShip ? (
            <p>
              Etiketter: {labelShip.status === "DELIVERED" ? "mottagna" : "på väg"} · {labelShip.carrier} ·{" "}
              {labelShip.trackingNo ?? "–"}
            </p>
          ) : (
            <p>Etikettstatus: väntar</p>
          )}
          {job.order.factoryReadyEstimate ? <p>Estimerat klart: {job.order.factoryReadyEstimate}</p> : null}
          {job.order.aquaApprovedDelivery ? <p>Godkänt leveransdatum: {job.order.aquaApprovedDelivery}</p> : null}
        </dl>
        <div className="mt-6 space-y-3">
          {canReceive ? (
            <form action={factoryAction}>
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="action" value="RECEIVE_LABELS" />
              <Button type="submit" size="lg" className="w-full">
                Etiketter mottagna
              </Button>
            </form>
          ) : null}
          {canEstimate ? (
            <form action={factoryAction} className="space-y-2">
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="action" value="ESTIMATE_DATE" />
              <input
                name="readyDate"
                type="date"
                defaultValue={job.order.factoryReadyEstimate ?? ""}
                required
                className={controlClass}
              />
              <Button type="submit" size="lg" className="w-full">
                Ange estimerat klart-datum
              </Button>
            </form>
          ) : null}
          {canStart ? (
            <form action={factoryAction}>
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="action" value="START" />
              <Button type="submit" size="lg" className="w-full">
                Starta produktion
              </Button>
            </form>
          ) : null}
          {canFinish ? (
            <form action={factoryAction} className="space-y-2">
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="action" value="DONE" />
              <input
                name="readyDate"
                type="date"
                className={controlClass}
              />
              <Button type="submit" size="lg" className="w-full">
                Produktion klar
              </Button>
            </form>
          ) : null}
          <LinkButton href={`/api/bottler/waybill?jobId=${job.id}`} size="lg" className="w-full">
            Printa fraktsedel
          </LinkButton>
          {canShip ? (
            <form action={factoryAction}>
              <input type="hidden" name="jobId" value={job.id} />
              <input type="hidden" name="action" value="SHIPPED" />
              <Button type="submit" size="lg" className="w-full">
                Markera skickad
              </Button>
            </form>
          ) : null}
          {job.order.documents.map((d) => (
            <p key={d.id} className="text-sm">
              <FileLink href={`/api/documents/${d.id}`}>{d.title}</FileLink>
            </p>
          ))}
        </div>
      </Panel>
    </DashPage>
    </div>
  );
}
