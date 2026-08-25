import { requireRole } from "@/server/rbac";
import { listJobsForFactory } from "@/server/services/production.service";
import { EmptyState, LinkButton, PageHeader, StatusChip } from "@/ui/shell/primitives";

export default async function FactoryHome() {
  const user = await requireRole(["FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]);
  const scoped = user.role === "FACTORY";
  const jobs =
    scoped && !user.factoryId ? [] : await listJobsForFactory(scoped ? user.factoryId ?? undefined : undefined);
  const today = jobs.filter((j) =>
    ["NOT_PLANNED", "PLANNED", "STARTED", "FILLING", "FILLED", "LABELING", "LABELS_APPLIED", "DONE"].includes(j.status),
  );
  const showFactory = !user.factoryId;

  if (scoped && !user.factoryId) {
    return (
      <div className="space-y-8">
        <PageHeader title="Produktion idag" subtitle="Jobb för den kopplade fabriken." />
        <EmptyState title="Ingen fabrik kopplad" body="Logga in som fabrikskonto för att se dagens jobb." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Produktion idag" subtitle={`${today.length} jobb`} />
      {today.length === 0 ? (
        <EmptyState title="Inga jobb idag" body="När etiketter är på väg eller produktion är planerad syns jobben här." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {today.map((j) => {
            const item = j.order.items[0];
            const opt = JSON.parse(item?.variant.optionsJson || "{}") as { waterType?: string; cap?: string };
            const volume = item?.variant.volumeMl ? `${item.variant.volumeMl / 10} cl` : item?.variant.name;
            return (
              <article key={j.id} className="flex flex-col rounded-[22px] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,.04)]">
                <p className="font-mono text-[13px] text-[#6b7280]">{j.order.orderNo}</p>
                {showFactory ? <p className="text-[12px] text-[#6b7280]">{j.factory.name}</p> : null}
                <h2 className="mt-1 text-[22px] font-semibold tracking-tight">
                  {item?.qty} × {volume}
                </h2>
                <p className="mt-1 text-sm text-[#6b7280]">
                  {[opt.waterType, opt.cap, item?.variant.product.name].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 text-sm">
                  Design: {j.order.designs[0]?.projectName ?? "–"}
                  {j.order.label ? ` · Etikett ${j.order.label.qty} st` : ""}
                </p>
                <p className="mt-4 text-sm">Etikett mottagen: {j.order.label?.receivedAt ? "Ja" : "Nej"}</p>
                <p className="text-sm">Leverans: {j.order.requestedDate ?? "–"}</p>
                <div className="mt-3">
                  <StatusChip status={j.status} label={j.status} />
                </div>
                <div className="mt-5">
                  <LinkButton href={`/factory/jobb/${j.id}`} size="lg">
                    Öppna
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
