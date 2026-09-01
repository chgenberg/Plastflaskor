import { FACTORY_JOB_LABELS, ORDER_STEP_LABELS, type OrderStatusCode } from "@/domain/enums";
import { prisma } from "@/server/db";
import { DashPage, DashTable, EmptyState, FilterChip, PageHeader, RowHit, StatusChip } from "@/ui/shell/primitives";

const GROUPS = [
  { id: "date", label: "Datum" },
  { id: "week", label: "Vecka" },
  { id: "product", label: "Produkt" },
  { id: "size", label: "Storlek" },
  { id: "water", label: "Stilla / kolsyrat" },
  { id: "status", label: "Status" },
] as const;

function groupKey(
  j: {
    plannedAt: Date | null;
    status: string;
    order: { items: { qty: number; variant: { volumeMl: number | null; optionsJson: string; product: { name: string } } }[] };
  },
  group: string,
) {
  const item = j.order.items[0];
  const opt = JSON.parse(item?.variant.optionsJson || "{}") as { waterType?: string };
  if (group === "week" && j.plannedAt) {
    const d = new Date(j.plannedAt);
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
    return `v${week}`;
  }
  if (group === "date") return j.plannedAt?.toLocaleDateString("sv-SE") ?? "Ej planerad";
  if (group === "product") return item?.variant.product.name ?? "–";
  if (group === "size") return item?.variant.volumeMl ? `${item.variant.volumeMl / 10} cl` : "–";
  if (group === "water") return opt.waterType?.includes("kolsyr") ? "Kolsyrat" : "Stilla";
  return FACTORY_JOB_LABELS[j.status] ?? j.status;
}

export default async function ProductionBoard({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const raw = (await searchParams).group ?? "date";
  const group = GROUPS.some((g) => g.id === raw) ? raw : "date";
  const jobs = await prisma.productionJob.findMany({
    where: { factory: { kind: "bottler" } },
    include: {
      order: {
        include: {
          customer: { select: { name: true } },
          items: { include: { variant: { include: { product: true } } } },
        },
      },
    },
    orderBy: { plannedAt: "asc" },
  });
  const grouped = new Map<string, typeof jobs>();
  for (const j of jobs) {
    const key = groupKey(j, group);
    grouped.set(key, [...(grouped.get(key) ?? []), j]);
  }

  return (
    <DashPage>
      <PageHeader title="Produktion" subtitle="Gruppera flaskjobb efter datum, produkt, storlek eller stilla/kolsyrat." />
      <div className="flex flex-wrap gap-1.5">
        {GROUPS.map((g) => (
          <FilterChip key={g.id} href={`/operations/produktion?group=${g.id}`} active={group === g.id}>
            {g.label}
          </FilterChip>
        ))}
      </div>
      {jobs.length === 0 ? (
        <EmptyState title="Inga jobb" body="När produktion planeras syns den här." />
      ) : (
        [...grouped.entries()].map(([key, rows]) => (
          <div key={key} className="space-y-2">
            <p className="text-[13px] font-semibold tracking-tight">
              {key} <span className="font-normal text-[var(--av-text-muted)]">· {rows.length}</span>
            </p>
            <DashTable
              columns={[
                { label: "Order" },
                { label: "Kund" },
                { label: "Innehåll" },
                { label: "Jobb" },
                { label: "Orderstatus" },
              ]}
            >
              {rows.map((j) => {
                const item = j.order.items[0];
                return (
                  <tr key={j.id}>
                    <td>
                      <RowHit href={`/operations/ordrar/${j.order.orderNo}`}>{j.order.orderNo}</RowHit>
                    </td>
                    <td>{j.order.customer.name}</td>
                    <td>{item ? `${item.variant.product.name} · ${item.qty.toLocaleString("sv-SE")} st` : "–"}</td>
                    <td>
                      <StatusChip status={j.status} label={FACTORY_JOB_LABELS[j.status] ?? j.status} />
                    </td>
                    <td>
                      <StatusChip
                        status={j.order.currentStatus}
                        label={ORDER_STEP_LABELS[j.order.currentStatus as OrderStatusCode]}
                        requestedDate={j.order.requestedDate}
                      />
                    </td>
                  </tr>
                );
              })}
            </DashTable>
          </div>
        ))
      )}
    </DashPage>
  );
}
