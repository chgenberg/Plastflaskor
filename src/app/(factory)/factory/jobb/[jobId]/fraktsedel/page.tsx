import { notFound } from "next/navigation";
import { requireRole } from "@/server/rbac";
import { getJob } from "@/server/services/production.service";
import { PrintButton } from "@/ui/shell/PrintButton";
import { EmptyState, FileLink, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function WaybillPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ tracking?: string }>;
}) {
  const { jobId } = await params;
  const { tracking } = await searchParams;
  const user = await requireRole(["FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]);
  const job = await getJob(jobId, user.role === "FACTORY" ? user.factoryId ?? undefined : undefined);
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Fraktsedel</p>
        <p className="mt-2 font-mono text-lg">{ship.trackingNo ?? "–"}</p>
        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="text-[#6b7280]">Mottagare</dt>
            <dd>{job.order.customer.name}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Adress</dt>
            <dd>
              {addr.line1}, {addr.postalCode} {addr.city}
            </dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Ordernummer</dt>
            <dd className="font-mono">{job.order.orderNo}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Antal</dt>
            <dd>{item?.qty != null ? `${item.qty.toLocaleString("sv-SE")} st` : "–"}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Kolli</dt>
            <dd>{ship.packages ?? "–"}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Vikt</dt>
            <dd>{`${ship.weightKg} kg`}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Transportör</dt>
            <dd>{ship.carrier ?? "–"}</dd>
          </div>
          <div>
            <dt className="text-[#6b7280]">Spårning</dt>
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
