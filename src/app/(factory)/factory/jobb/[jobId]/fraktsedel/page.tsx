import { notFound } from "next/navigation";
import { requireRole } from "@/server/rbac";
import { getJob } from "@/server/services/production.service";
import { createWaybillAction } from "@/actions";
import { PrintButton } from "@/ui/shell/PrintButton";

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
    <div className="mx-auto max-w-xl">
      {!tracking ? (
        <form action={createWaybillAction} className="rounded-2xl bg-white p-6">
          <h1 className="text-3xl font-semibold">Skapa fraktsedel</h1>
          <input type="hidden" name="orderId" value={job.orderId} />
          <input type="hidden" name="jobId" value={job.id} />
          <label className="mt-4 block text-sm">Kolli<input name="packages" defaultValue={4} className="mt-1 h-11 w-full rounded-xl border px-3" /></label>
          <label className="mt-3 block text-sm">Vikt kg<input name="weightKg" defaultValue={80} className="mt-1 h-11 w-full rounded-xl border px-3" /></label>
          <label className="mt-3 block text-sm">
            Transportör
            <select name="carrier" className="mt-1 h-11 w-full rounded-xl border px-3">
              <option>PostNord</option>
              <option>DHL</option>
              <option>Schenker</option>
            </select>
          </label>
          <button className="mt-6 h-12 w-full rounded-xl bg-[var(--av-accent)] text-white">Skapa sändning</button>
        </form>
      ) : (
        <div className="rounded-2xl bg-white p-8 print:shadow-none">
          <h1 className="text-2xl font-semibold">Fraktsedel (mock)</h1>
          <p className="mt-2 font-mono text-lg">{tracking}</p>
          <dl className="mt-6 space-y-2 text-sm">
            <div><dt className="text-[var(--av-text-muted)]">Mottagare</dt><dd>{job.order.customer.name}</dd></div>
            <div><dt className="text-[var(--av-text-muted)]">Adress</dt><dd>{addr.line1}, {addr.postalCode} {addr.city}</dd></div>
            <div><dt className="text-[var(--av-text-muted)]">Ordernummer</dt><dd>{job.order.orderNo}</dd></div>
            <div><dt className="text-[var(--av-text-muted)]">Antal</dt><dd>{item?.qty}</dd></div>
            <div><dt className="text-[var(--av-text-muted)]">Tracking</dt><dd className="font-mono">{tracking}</dd></div>
          </dl>
          <PrintButton />
        </div>
      )}
    </div>
  );
}
