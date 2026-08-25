import { prisma } from "@/server/db";
import { listAllOrders } from "@/server/services/order.service";
import { KpiCard, PageHeader } from "@/ui/shell/primitives";

async function averageProductionDays() {
  const events = await prisma.statusEvent.findMany({
    where: { entityType: "ORDER", toStatus: { in: ["ORDER_RECEIVED", "PRODUCTION_DONE"] } },
    select: { entityId: true, toStatus: true, occurredAt: true },
  });
  const received = new Map<string, Date>();
  const done = new Map<string, Date>();
  for (const e of events) {
    if (e.toStatus === "ORDER_RECEIVED") {
      const prev = received.get(e.entityId);
      if (!prev || e.occurredAt < prev) received.set(e.entityId, e.occurredAt);
    }
    if (e.toStatus === "PRODUCTION_DONE") {
      const prev = done.get(e.entityId);
      if (!prev || e.occurredAt < prev) done.set(e.entityId, e.occurredAt);
    }
  }
  const days: number[] = [];
  for (const [id, end] of done) {
    const start = received.get(id);
    if (!start) continue;
    const d = (end.getTime() - start.getTime()) / 86_400_000;
    if (d >= 0) days.push(d);
  }
  if (days.length === 0) return null;
  return days.reduce((a, b) => a + b, 0) / days.length;
}

export default async function LeadershipPage() {
  const orders = await listAllOrders();
  const bottles = orders
    .filter((o) => o.items[0]?.variant.product.category === "WATER")
    .reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);
  const cups = orders
    .filter((o) => o.items[0]?.variant.product.category === "PAPER_CUP")
    .reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);
  const repeats = orders.filter((o) => o.source === "repeat").length;
  const avgDays = await averageProductionDays();
  const month = new Date().toLocaleDateString("sv-SE", { month: "long" });
  const title = month.charAt(0).toUpperCase() + month.slice(1);

  return (
    <div className="space-y-8">
      <PageHeader title={title} subtitle="Siffror från ordrar och statushändelser. Inga uppskattade tal." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Ordrar" value={orders.length} />
        <KpiCard label="Flaskor" value={bottles.toLocaleString("sv-SE")} />
        <KpiCard label="Pappersmuggar" value={cups.toLocaleString("sv-SE")} />
        <KpiCard label="Repeat orders" value={`${Math.round((repeats / Math.max(orders.length, 1)) * 100)} %`} />
        {avgDays !== null ? (
          <KpiCard label="Genomsnittlig produktionstid" value={`${avgDays.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} dagar`} />
        ) : null}
      </div>
    </div>
  );
}
