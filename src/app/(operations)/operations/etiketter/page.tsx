import Link from "next/link";
import { prisma } from "@/server/db";
import { labelAdvanceAction } from "@/actions";
import { LABEL_NEXT, LABEL_STATUS_LABELS } from "@/domain/enums";
import { Button, EmptyState, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function LabelsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const labels = await prisma.label.findMany({
    include: { order: { include: { reseller: { include: { company: true } }, items: { include: { variant: { include: { product: true } } } } } } },
  });
  const filtered = labels.filter((l) => {
    if (filter === "not_shipped") return l.status === "PRINTED" || l.status === "ORDERED" || l.status === "PRINTING";
    return true;
  });
  return (
    <div className="space-y-8">
      <PageHeader title="Etiketter" subtitle="Beställ, markera tryckt och skicka till fabrik." />
      <div className="flex gap-3 text-sm">
        <Link href="/operations/etiketter" className={filter ? "text-[#6b7280]" : "font-medium text-[#3B5BAA]"}>
          Alla
        </Link>
        <Link href="/operations/etiketter?filter=not_shipped" className={filter === "not_shipped" ? "font-medium text-[#3B5BAA]" : "text-[#6b7280]"}>
          Inte skickade till fabrik
        </Link>
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Inga etiketter" body="När etiketter beställs syns de här." />
      ) : (
        <Panel padded={false}>
          <ul className="divide-y divide-black/5">
            {filtered.map((l) => {
              const next = LABEL_NEXT[l.status];
              return (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                  <Link href={`/operations/ordrar/${l.order.orderNo}`} className="font-mono text-[#3B5BAA]">
                    {l.order.orderNo}
                  </Link>
                  <span>{l.order.reseller.company.name}</span>
                  <span>{l.order.items[0]?.variant.product.name}</span>
                  <span className="font-medium">{LABEL_STATUS_LABELS[l.status] ?? l.status}</span>
                  <span className="font-mono text-[#6b7280]">{l.trackingNo ?? "–"}</span>
                  {next ? (
                    <form action={labelAdvanceAction}>
                      <input type="hidden" name="labelId" value={l.id} />
                      <input type="hidden" name="to" value={next.to} />
                      <Button type="submit" variant="secondary">
                        {next.label}
                      </Button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}
