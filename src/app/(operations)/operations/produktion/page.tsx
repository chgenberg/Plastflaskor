import Link from "next/link";
import { prisma } from "@/server/db";

export default async function ProductionBoard() {
  const jobs = await prisma.productionJob.findMany({
    include: { order: { include: { items: { include: { variant: { include: { product: true } } } } } }, factory: true },
    orderBy: { plannedAt: "asc" },
  });
  const week = jobs.reduce(
    (acc, j) => {
      const qty = j.order.items.reduce((s, i) => s + i.qty, 0);
      const cat = j.order.items[0]?.variant.product.category;
      if (cat === "WATER") acc.bottles += qty;
      if (cat === "PAPER_CUP") acc.cups += qty;
      if ((j.order.items[0]?.variant.volumeMl ?? 0) <= 330) acc.size33 += qty;
      else acc.size50 += qty;
      return acc;
    },
    { bottles: 0, cups: 0, size33: 0, size50: 0 },
  );

  return (
    <div>
      <h1 className="text-3xl font-semibold">Produktion</h1>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-4"><p className="text-xs">33 cl</p><p className="text-2xl font-semibold">{week.size33}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs">50 cl+</p><p className="text-2xl font-semibold">{week.size50}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs">Flaskor</p><p className="text-2xl font-semibold">{week.bottles}</p></div>
        <div className="rounded-2xl bg-white p-4"><p className="text-xs">Muggar</p><p className="text-2xl font-semibold">{week.cups}</p></div>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-[var(--av-text-muted)]">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th>Fabrik</th>
              <th>Planerad</th>
              <th>Status</th>
              <th className="text-right">Antal</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-t">
                <td className="px-4 py-2">
                  <Link href={`/operations/ordrar/${j.order.orderNo}`} className="font-mono text-[var(--av-accent)]">
                    {j.order.orderNo}
                  </Link>
                </td>
                <td>{j.factory.name}</td>
                <td>{j.plannedAt?.toLocaleDateString("sv-SE")}</td>
                <td>{j.status}</td>
                <td className="text-right">{j.order.items[0]?.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
