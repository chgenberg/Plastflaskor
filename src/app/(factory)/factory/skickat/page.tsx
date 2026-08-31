import { requireRole } from "@/server/rbac";
import { prisma } from "@/server/db";
import { shipmentTrackingSteps } from "@/domain/orderBrief";
import { EmptyState, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";

export default async function ShippedPage() {
  const user = await requireRole(["FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]);
  if (!user.factoryId && user.role === "FACTORY") {
    return (
      <div className="space-y-8">
        <PageHeader title="Skickat" />
        <EmptyState title="Ingen tryckeri kopplat" body="Logga in som tryckeri för att se skickade muggjobb." />
      </div>
    );
  }
  const shipments = await prisma.shipment.findMany({
    where: {
      ...(user.factoryId ? { order: { factoryId: user.factoryId } } : {}),
      OR: [{ status: { in: ["PICKED_UP", "IN_TRANSIT", "DELIVERED"] } }, { shippedAt: { not: null } }],
    },
    include: { order: { select: { orderNo: true } } },
    orderBy: { shippedAt: "desc" },
  });
  return (
    <div className="space-y-8">
      <PageHeader title="Skickat" subtitle="Sändningar från fabriken." />
      {shipments.length === 0 ? (
        <EmptyState title="Inga muggar skickade" body="När ett muggjobb markeras som skickat syns sändningen här." />
      ) : (
        <div className="grid gap-4">
          {shipments.map((s) => {
            const steps = shipmentTrackingSteps(s.status);
            const current = steps.find((st) => st.current);
            return (
              <Panel key={s.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="av-label">Order</p>
                    <p className="mt-1 font-mono text-lg font-semibold">{s.order.orderNo}</p>
                  </div>
                  <StatusChip status={s.status} label={current?.label ?? "Skapad"} />
                </div>
                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="av-label">Transportör</dt>
                    <dd className="mt-1 font-medium">{s.carrier}</dd>
                  </div>
                  <div>
                    <dt className="av-label">Spårning</dt>
                    <dd className="mt-1 font-mono text-[var(--av-text-muted)]">{s.trackingNo}</dd>
                  </div>
                </dl>
                <ol className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  {steps.map((st) => (
                    <li
                      key={st.id}
                      className={st.current ? "font-semibold" : st.done ? "font-medium" : "text-[var(--av-text-muted)]"}
                    >
                      {st.label}
                    </li>
                  ))}
                </ol>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
