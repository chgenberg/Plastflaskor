import { notFound } from "next/navigation";
import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { getJob } from "@/server/services/production.service";
import { PrintButton } from "@/ui/shell/PrintButton";
import { EmptyState, FileLink, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function BottlerWaybillPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ tracking?: string }>;
}) {
  const { jobId } = await params;
  const { tracking } = await searchParams;
  const user = await requireSupplier("bottler");
  const job = await getJob(jobId, scopedFactoryId(user), "bottler");
  if (!job) notFound();
  const addr = job.order.shippingAddress;
  const item = job.order.items[0];
  const ship =
    job.order.shipments.find((s) => tracking && s.trackingNo === tracking) ??
    job.order.shipments.find((s) => s.type === "GOODS_TO_CUSTOMER") ??
    job.order.shipments[0];
  const waybillDocs = job.order.documents.filter((d) => d.kind === "WAYBILL");

  if (!ship) {
    return (
      <div className="mx-auto max-w-xl space-y-8">
        <PageHeader title="Fraktsedel" subtitle={job.order.orderNo} />
        <EmptyState
          title="Ingen fraktsedel ännu"
          body="Fraktsedel skapas av AquaVisibility. När den finns kan ni ladda ner den och markera jobbet som skickat."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader title="Fraktsedel" subtitle={job.order.orderNo} />
      <Panel>
        <p className="av-label">Fraktsedel</p>
        <p className="mt-2 font-mono text-lg">{ship.trackingNo ?? "–"}</p>
        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="text-[var(--av-text-muted)]">Mottagare</dt>
            <dd>{job.order.customer.name}</dd>
          </div>
          <div>
            <dt className="text-[var(--av-text-muted)]">Adress</dt>
            <dd>
              {addr.line1}, {addr.postalCode} {addr.city}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--av-text-muted)]">Ordernummer</dt>
            <dd className="font-mono">{job.order.orderNo}</dd>
          </div>
          <div>
            <dt className="text-[var(--av-text-muted)]">Antal</dt>
            <dd>{item?.qty != null ? `${item.qty.toLocaleString("sv-SE")} st` : "–"}</dd>
          </div>
          <div>
            <dt className="text-[var(--av-text-muted)]">Kolli</dt>
            <dd>{ship.packages ?? "–"}</dd>
          </div>
          <div>
            <dt className="text-[var(--av-text-muted)]">Vikt</dt>
            <dd>{`${ship.weightKg} kg`}</dd>
          </div>
          <div>
            <dt className="text-[var(--av-text-muted)]">Transportör</dt>
            <dd>{ship.carrier ?? "–"}</dd>
          </div>
          <div>
            <dt className="text-[var(--av-text-muted)]">Spårning</dt>
            <dd className="font-mono">{ship.trackingNo ?? "–"}</dd>
          </div>
        </dl>
        {waybillDocs.length > 0 ? (
          <div className="mt-4 space-y-1.5">
            {waybillDocs.map((d) => (
              <p key={d.id} className="text-sm">
                <FileLink href={`/api/documents/${d.id}`}>{d.title}</FileLink>
              </p>
            ))}
          </div>
        ) : null}
        <PrintButton />
      </Panel>
    </div>
  );
}
