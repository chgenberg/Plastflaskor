import { requireRole } from "@/server/rbac";
import { prisma } from "@/server/db";

export default async function ShippedPage() {
  const user = await requireRole(["FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]);
  const shipments = await prisma.shipment.findMany({
    where: user.factoryId ? { order: { factoryId: user.factoryId } } : undefined,
    include: { order: true },
    orderBy: { shippedAt: "desc" },
  });
  return (
    <div>
      <h1 className="text-3xl font-semibold">Skickat</h1>
      <ul className="mt-6 divide-y rounded-2xl bg-white">
        {shipments.map((s) => (
          <li key={s.id} className="flex justify-between px-4 py-3 text-sm">
            <span className="font-mono">{s.order.orderNo}</span>
            <span>{s.carrier}</span>
            <span className="font-mono">{s.trackingNo}</span>
            <span>{s.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
