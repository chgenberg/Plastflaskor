import Link from "next/link";
import { FACTORY_JOB_LABELS, ORDER_STEP_LABELS, type OrderStatusCode } from "@/domain/enums";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { prisma } from "@/server/db";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { EmptyState, PageHeader, StatusChip } from "@/ui/shell/primitives";

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
    <div className="space-y-8">
      <PageHeader title="Produktion" subtitle="Gruppera flaskjobb efter datum, produkt, storlek eller stilla/kolsyrat." />
      <form className="flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <Link
            key={g.id}
            href={`/operations/produktion?group=${g.id}`}
            className={`rounded-full px-3 py-1.5 text-sm ${group === g.id ? "bg-[var(--av-accent-soft)] font-medium text-[var(--av-accent)]" : "text-[var(--av-text-muted)]"}`}
          >
            {g.label}
          </Link>
        ))}
      </form>
      {jobs.length === 0 ? (
        <EmptyState title="Inga jobb" body="När produktion planeras syns den här." />
      ) : (
        [...grouped.entries()].map(([key, rows]) => (
          <div key={key} className="space-y-3">
            <p className="text-[15px] font-semibold tracking-tight">{key}</p>
            <div className="grid gap-3">
              {rows.map((j) => {
                const item = j.order.items[0];
                const spec = specFromOrderItem({
                  visualSpecJson: j.order.visualSpecJson,
                  item,
                  imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
                });
                return (
                  <Link
                    key={j.id}
                    href={`/operations/ordrar/${j.order.orderNo}`}
                    className="block av-card p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[var(--av-accent)]">{j.order.orderNo}</p>
                        <p className="mt-1 font-medium">{j.order.customer.name}</p>
                        <p className="mt-0.5 text-sm text-[var(--av-text-muted)]">
                          {spec?.productName ?? item?.variant.product.name ?? "–"}
                          {item ? ` · ${item.qty.toLocaleString("sv-SE")} st` : ""}
                        </p>
                        {spec ? (
                          <div className="mt-2">
                            <VisualSpecCard spec={spec} compact />
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusChip status={j.status} label={FACTORY_JOB_LABELS[j.status] ?? j.status} />
                        <StatusChip
                          status={j.order.currentStatus}
                          label={ORDER_STEP_LABELS[j.order.currentStatus as OrderStatusCode]}
                          requestedDate={j.order.requestedDate}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
