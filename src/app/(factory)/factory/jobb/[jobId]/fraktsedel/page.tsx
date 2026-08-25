import { notFound } from "next/navigation";
import { requireRole } from "@/server/rbac";
import { getJob } from "@/server/services/production.service";
import { createWaybillAction } from "@/actions";
import { PrintButton } from "@/ui/shell/PrintButton";
import { Button, PageHeader, Panel } from "@/ui/shell/primitives";

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

  return (
    <div className="mx-auto max-w-xl space-y-8">
      {!tracking ? (
        <>
          <PageHeader title="Fraktsedel" subtitle={job.order.orderNo} />
          <Panel>
            <form action={createWaybillAction} className="space-y-4">
              <input type="hidden" name="orderId" value={job.orderId} />
              <input type="hidden" name="jobId" value={job.id} />
              <label className="block text-sm">
                Kolli
                <input name="packages" defaultValue={4} className="mt-1 h-12 w-full rounded-xl border border-black/10 px-3" />
              </label>
              <label className="block text-sm">
                Vikt kg
                <input name="weightKg" defaultValue={80} className="mt-1 h-12 w-full rounded-xl border border-black/10 px-3" />
              </label>
              <label className="block text-sm">
                Transportör
                <select name="carrier" className="mt-1 h-12 w-full rounded-xl border border-black/10 px-3">
                  <option>PostNord</option>
                  <option>DHL</option>
                  <option>Schenker</option>
                </select>
              </label>
              <Button type="submit" size="lg" className="w-full">
                Skapa sändning
              </Button>
            </form>
          </Panel>
        </>
      ) : (
        <Panel>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Fraktsedel</p>
          <p className="mt-2 font-mono text-lg">{tracking}</p>
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
              <dd>{item?.qty}</dd>
            </div>
          </dl>
          <PrintButton />
        </Panel>
      )}
    </div>
  );
}
