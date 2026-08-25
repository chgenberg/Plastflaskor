import { requireRole } from "@/server/rbac";
import { prisma } from "@/server/db";
import { EmptyState, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function ShippedPage() {
  const user = await requireRole(["FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]);
  if (!user.factoryId && user.role === "FACTORY") {
    return (
      <div className="space-y-8">
        <PageHeader title="Skickat" />
        <EmptyState title="Ingen fabrik kopplad" body="Logga in som fabrikskonto för att se sändningar." />
      </div>
    );
  }
  const shipments = await prisma.shipment.findMany({
    where: user.factoryId ? { order: { factoryId: user.factoryId } } : undefined,
    include: { order: true },
    orderBy: { shippedAt: "desc" },
  });
  return (
    <div className="space-y-8">
      <PageHeader title="Skickat" subtitle="Sändningar från fabriken." />
      {shipments.length === 0 ? (
        <EmptyState title="Inget skickat ännu" body="När en fraktsedel skapas syns sändningen här." />
      ) : (
        <Panel padded={false}>
          <ul className="divide-y divide-black/5">
            {shipments.map((s) => (
              <li key={s.id} className="flex flex-wrap justify-between gap-3 px-5 py-3 text-sm">
                <span className="font-mono">{s.order.orderNo}</span>
                <span>{s.carrier}</span>
                <span className="font-mono text-[#6b7280]">{s.trackingNo}</span>
                <span>{s.status}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
