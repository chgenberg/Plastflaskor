import Link from "next/link";
import { prisma } from "@/server/db";
import { DataRow, DataTable, EmptyState, KpiCard, PageHeader, Panel } from "@/ui/shell/primitives";

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
    <div className="space-y-8">
      <PageHeader title="Produktion" subtitle="Planerade jobb i fabrik." />
      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="33 cl" value={week.size33} />
        <KpiCard label="50 cl+" value={week.size50} />
        <KpiCard label="Flaskor" value={week.bottles} />
        <KpiCard label="Muggar" value={week.cups} />
      </div>
      {jobs.length === 0 ? (
        <EmptyState title="Inga jobb" body="När produktion planeras syns den här." />
      ) : (
        <Panel padded={false}>
          <DataTable
            headers={[
              { label: "Order" },
              { label: "Fabrik" },
              { label: "Planerad" },
              { label: "Status" },
              { label: "Antal", align: "right" },
            ]}
          >
            {jobs.map((j) => (
              <DataRow key={j.id} href={`/operations/ordrar/${j.order.orderNo}`}>
                <td className="px-5 py-3">
                  <Link href={`/operations/ordrar/${j.order.orderNo}`} className="font-mono text-[#3B5BAA]">
                    {j.order.orderNo}
                  </Link>
                </td>
                <td className="px-5 py-3">{j.factory.name}</td>
                <td className="px-5 py-3">{j.plannedAt?.toLocaleDateString("sv-SE") ?? "–"}</td>
                <td className="px-5 py-3">{j.status}</td>
                <td className="px-5 py-3 text-right tabular-nums">{j.order.items[0]?.qty}</td>
              </DataRow>
            ))}
          </DataTable>
        </Panel>
      )}
    </div>
  );
}
