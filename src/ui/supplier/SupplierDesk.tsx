import Link from "next/link";
import { factoryAction } from "@/actions";
import { FACTORY_JOB_LABELS } from "@/domain/enums";
import { ActionCard, Button, DashTable, EmptyState, LinkButton, PageHeader, StatusChip, TableActions } from "@/ui/shell/primitives";

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
      <div className="space-y-4">
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
    <div className="space-y-4">
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
      <h2 className="text-[13px] font-semibold tracking-tight">Beställningar</h2>
      {visible.length === 0 ? (
        <EmptyState
          title="Inga beställningar just nu"
          body={kind === "label" ? "När Aqua skickat en orderbekräftelse syns etikettjobben här." : "När etiketterna är skickade syns flaskjobben här."}
        />
      ) : (
        <DashTable
          count={`${visible.length} jobb`}
          columns={[
            { label: "Order" },
            { label: "Kund" },
            { label: "Innehåll" },
            { label: "Skickdatum" },
            { label: "Status" },
            { label: "Åtgärd", sr: true },
          ]}
        >
          {visible.map((j) => (
            <SupplierJobRow key={j.id} job={j} kind={kind} basePath={basePath} />
          ))}
        </DashTable>
      )}
    </div>
  );
}

function SupplierJobRow({ job: j, kind, basePath }: { job: Job; kind: SupplierKind; basePath: string }) {
  const item = j.order.items[0];
  const waybill = j.order.shipments.find((s) => s.type === "GOODS_TO_CUSTOMER");
  const canShip = kind === "bottler" && j.order.currentStatus === "READY_TO_SHIP" && Boolean(waybill);
  const needsDeadline =
    !j.order.factoryDeadlineAccepted &&
    (j.order.currentStatus === "CONFIRMED" || j.order.currentStatus === "LABEL_PRODUCTION");
  const canReceive = kind === "bottler" && j.order.currentStatus === "LABELS_DISPATCHED";
  const canStart =
    kind === "bottler" &&
    (j.order.currentStatus === "LABELS_RECEIVED" || j.order.currentStatus === "PRODUCTION_SCHEDULED");
  const jobHref = `${basePath}/jobb/${j.id}`;
  const product = item ? `${item.variant.product.name} · ${item.qty.toLocaleString("sv-SE")} st` : "–";
  const deadline = j.order.factoryDeadline
    ? `${j.order.factoryDeadline}${j.order.factoryDeadlineAccepted ? " · accepterad" : ""}`
    : "–";

  return (
    <tr>
      <td>
        <Link href={jobHref} className="font-semibold text-[var(--av-text)] hover:text-[var(--av-accent)]">
          {j.order.orderNo}
        </Link>
      </td>
      <td>{j.order.customer.name}</td>
      <td>{product}</td>
      <td className="whitespace-nowrap text-[var(--av-text-secondary)]">{deadline}</td>
      <td>
        <StatusChip status={j.status} label={FACTORY_JOB_LABELS[j.status] ?? j.status} />
      </td>
      <td className="av-actions">
        <TableActions>
          <LinkButton href={jobHref} variant="secondary" size="sm">
            Öppna
          </LinkButton>
          {needsDeadline && kind === "label" ? (
            <form action={factoryAction}>
              <input type="hidden" name="jobId" value={j.id} />
              <input type="hidden" name="action" value="ACCEPT_DEADLINE" />
              <Button type="submit" size="sm">
                Acceptera datum
              </Button>
            </form>
          ) : null}
          {canReceive ? (
            <form action={factoryAction}>
              <input type="hidden" name="jobId" value={j.id} />
              <input type="hidden" name="action" value="RECEIVE_LABELS" />
              <Button type="submit" size="sm">
                Ta emot etiketter
              </Button>
            </form>
          ) : null}
          {canStart ? (
            <form action={factoryAction}>
              <input type="hidden" name="jobId" value={j.id} />
              <input type="hidden" name="action" value="START" />
              <Button type="submit" size="sm">
                Starta
              </Button>
            </form>
          ) : null}
          {canShip ? (
            <form action={factoryAction}>
              <input type="hidden" name="jobId" value={j.id} />
              <input type="hidden" name="action" value="SHIPPED" />
              <Button type="submit" size="sm">
                Markera skickad
              </Button>
            </form>
          ) : null}
        </TableActions>
      </td>
    </tr>
  );
}
