import Link from "next/link";
import { prisma } from "@/server/db";

export default async function LabelsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const labels = await prisma.label.findMany({
    include: { order: { include: { reseller: { include: { company: true } }, items: { include: { variant: { include: { product: true } } } } } } },
  });
  const filtered = labels.filter((l) => {
    if (filter === "not_shipped") return l.status === "PRINTED" || l.status === "ORDERED";
    return true;
  });
  return (
    <div>
      <h1 className="text-3xl font-semibold">Etikettflöde</h1>
      <div className="mt-4 flex gap-3 text-sm">
        <Link href="/operations/etiketter">Alla</Link>
        <Link href="/operations/etiketter?filter=not_shipped" className="text-[var(--av-accent)]">
          Etiketter som inte skickats till fabrik
        </Link>
      </div>
      <ul className="mt-6 divide-y rounded-2xl bg-white">
        {filtered.map((l) => (
          <li key={l.id} className="flex justify-between px-4 py-3 text-sm">
            <Link href={`/operations/ordrar/${l.order.orderNo}`} className="font-mono text-[var(--av-accent)]">
              {l.order.orderNo}
            </Link>
            <span>{l.order.reseller.company.name}</span>
            <span>{l.status}</span>
            <span>{l.trackingNo ?? "–"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
