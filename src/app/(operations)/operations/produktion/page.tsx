import Link from "next/link";
import { prisma } from "@/server/db";
import { DataRow, DataTable, EmptyState, KpiCard, PageHeader, Panel } from "@/ui/shell/primitives";

const GROUPS = [
  { id: "date", label: "Datum" },
  { id: "week", label: "Vecka" },
  { id: "product", label: "Produkt" },
  { id: "size", label: "Storlek" },
  { id: "water", label: "Vatten" },
  { id: "label", label: "Etikett" },
  { id: "factory", label: "Fabrik" },
  { id: "status", label: "Status" },
] as const;

function groupKey(
  j: {
    plannedAt: Date | null;
    status: string;
    factory: { name: string };
    order: { items: { qty: number; variant: { volumeMl: number | null; optionsJson: string; product: { name: string } } }[] };
  },
  group: string,
) {
  const item = j.order.items[0];
  const opt = JSON.parse(item?.variant.optionsJson || "{}") as { waterType?: string; label?: string };
  if (group === "week" && j.plannedAt) {
    const d = new Date(j.plannedAt);
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
    return `v${week}`;
  }
  if (group === "date") return j.plannedAt?.toLocaleDateString("sv-SE") ?? "Ej planerad";
  if (group === "product") return item?.variant.product.name ?? "–";
  if (group === "size") return item?.variant.volumeMl ? `${item.variant.volumeMl / 10} cl` : "–";
  if (group === "water") return opt.waterType ?? "–";
  if (group === "label") return opt.label ?? "–";
  if (group === "factory") return j.factory.name;
  return j.status;
}

export default async function ProductionBoard({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const { group = "date" } = await searchParams;
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
  const grouped = new Map<string, typeof jobs>();
  for (const j of jobs) {
    const key = groupKey(j, group);
    grouped.set(key, [...(grouped.get(key) ?? []), j]);
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Produktion" subtitle="Gruppera jobb efter datum, vecka, produkt, storlek, vatten, etikett, fabrik eller status." />
      <form className="flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <Link
            key={g.id}
            href={`/operations/produktion?group=${g.id}`}
            className={`rounded-full px-3 py-1.5 text-sm ${group === g.id ? "bg-[#E8EEFA] font-medium text-[#3B5BAA]" : "text-[#6b7280]"}`}
          >
            {g.label}
          </Link>
        ))}
      </form>
      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="33 cl" value={week.size33} />
        <KpiCard label="50 cl+" value={week.size50} />
        <KpiCard label="Flaskor" value={week.bottles} />
        <KpiCard label="Muggar" value={week.cups} />
      </div>
      {jobs.length === 0 ? (
        <EmptyState title="Inga jobb" body="När produktion planeras syns den här." />
      ) : (
        [...grouped.entries()].map(([key, rows]) => (
          <Panel key={key} title={key} padded={false}>
            <DataTable
              headers={[
                { label: "Order" },
                { label: "Fabrik" },
                { label: "Planerad" },
                { label: "Status" },
                { label: "Antal", align: "right" },
              ]}
            >
              {rows.map((j) => (
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
        ))
      )}
    </div>
  );
}
