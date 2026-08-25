import { listAllOrders } from "@/server/services/order.service";
import { KpiCard } from "@/ui/shell/primitives";

export default async function LeadershipPage() {
  const orders = await listAllOrders();
  const bottles = orders
    .filter((o) => o.items[0]?.variant.product.category === "WATER")
    .reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);
  const cups = orders
    .filter((o) => o.items[0]?.variant.product.category === "PAPER_CUP")
    .reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);
  const repeats = orders.filter((o) => o.source === "repeat").length;
  return (
    <div>
      <h1 className="text-3xl font-semibold">Augusti</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label="Ordrar" value={orders.length} />
        <KpiCard label="Flaskor" value={bottles.toLocaleString("sv-SE")} />
        <KpiCard label="Pappersmuggar" value={cups.toLocaleString("sv-SE")} />
        <KpiCard label="Repeat orders" value={`${Math.round((repeats / Math.max(orders.length, 1)) * 100)} %`} />
        <KpiCard label="Genomsnittlig produktionstid" value="8,4 dagar" />
      </div>
    </div>
  );
}
