import { notFound } from "next/navigation";
import { requireRole } from "@/server/rbac";
import { getJob } from "@/server/services/production.service";
import { factoryAction } from "@/actions";
import Link from "next/link";

export default async function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const user = await requireRole(["FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]);
  const job = await getJob(jobId, user.role === "FACTORY" ? user.factoryId ?? undefined : undefined);
  if (!job) notFound();
  const item = job.order.items[0];
  const received = Boolean(job.order.label?.receivedAt);

  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-white p-6">
      <p className="font-mono">{job.order.orderNo}</p>
      <h1 className="text-3xl font-semibold">{item?.qty} × {item?.variant.product.name}</h1>
      <p className="mt-2 text-sm">
        {job.order.shippingAddress.line1}, {job.order.shippingAddress.city}
      </p>
      <p className="mt-2 text-sm">Etiketter {received ? "mottagna ✓" : "ej mottagna"}</p>
      <div className="mt-6 space-y-3">
        {!received ? (
          <form action={factoryAction}>
            <input type="hidden" name="jobId" value={job.id} />
            <input type="hidden" name="action" value="LABELS_RECEIVED_BY_FACTORY" />
            <button className="h-12 w-full rounded-xl border text-sm">Markera etiketter mottagna</button>
          </form>
        ) : null}
        {job.status !== "STARTED" && job.status !== "DONE" ? (
          <form action={factoryAction}>
            <input type="hidden" name="jobId" value={job.id} />
            <input type="hidden" name="action" value="PRODUCTION_STARTED" />
            <button disabled={!received} className="h-12 w-full rounded-xl bg-[var(--av-accent)] text-sm text-white disabled:opacity-40">
              Starta produktion
            </button>
          </form>
        ) : null}
        {job.status === "STARTED" ? (
          <form action={factoryAction}>
            <input type="hidden" name="jobId" value={job.id} />
            <input type="hidden" name="action" value="PRODUCTION_DONE" />
            <button className="h-12 w-full rounded-xl bg-[var(--av-accent)] text-sm text-white">Markera produktion klar</button>
          </form>
        ) : null}
        {job.status === "DONE" ? (
          <Link href={`/factory/jobb/${job.id}/fraktsedel`} className="flex h-12 items-center justify-center rounded-xl bg-[var(--av-accent)] text-sm text-white">
            Skriv ut fraktsedel
          </Link>
        ) : null}
      </div>
    </div>
  );
}
