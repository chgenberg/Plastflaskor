import Link from "next/link";
import { requireRole } from "@/server/rbac";
import { listJobsForFactory } from "@/server/services/production.service";
import { StatusChip } from "@/ui/shell/primitives";

export default async function FactoryHome() {
  const user = await requireRole(["FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]);
  const factoryId = user.factoryId;
  const jobs = factoryId ? await listJobsForFactory(factoryId) : [];
  const today = jobs.filter((j) => ["PLANNED", "STARTED", "DONE", "NOT_PLANNED"].includes(j.status));

  return (
    <div>
      <h1 className="text-3xl font-semibold">Produktion idag</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {today.map((j) => {
          const item = j.order.items[0];
          const opt = JSON.parse(item?.variant.optionsJson || "{}") as { waterType?: string; cap?: string };
          return (
            <article key={j.id} className="rounded-2xl bg-white p-5">
              <p className="font-mono text-sm">{j.order.orderNo}</p>
              <h2 className="mt-1 text-xl font-semibold">
                {item?.qty} × {item?.variant.volumeMl ? `${item.variant.volumeMl / 10} cl` : item?.variant.name}
              </h2>
              <p className="text-sm text-[var(--av-text-secondary)]">
                {opt.waterType ?? ""} · {opt.cap ?? ""} · {item?.variant.product.name}
              </p>
              <p className="mt-2 text-sm">Etiketter {j.order.label?.receivedAt ? "mottagna ✓" : "väntar"}</p>
              <p className="text-sm">Leverans: {j.order.requestedDate ?? "–"}</p>
              <StatusChip status={j.status} label={j.status} />
              <Link href={`/factory/jobb/${j.id}`} className="mt-4 inline-block rounded-xl bg-[var(--av-accent)] px-4 py-2 text-sm text-white">
                Öppna jobb
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
