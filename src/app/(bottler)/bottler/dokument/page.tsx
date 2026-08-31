import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { prisma } from "@/server/db";
import { EmptyState, FileLink, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function BottlerDocs() {
  const user = await requireSupplier("bottler");
  const factoryId = scopedFactoryId(user);
  if ((user.role === "BOTTLER" || user.role === "FACTORY") && !user.factoryId) {
    return (
      <div className="space-y-8">
        <PageHeader title="Dokument" />
        <EmptyState title="Ingen bottler kopplad" body="Produktions- och logistikdokument visas här. Inga fakturor." />
      </div>
    );
  }
  const docs = await prisma.document.findMany({
    where: {
      kind: { in: ["PRODUCTION", "LOGISTICS", "ARTWORK", "WAYBILL"] },
      ...(factoryId ? { order: { OR: [{ factoryId }, { jobs: { some: { factoryId } } }] } } : {}),
    },
    include: { order: true },
  });
  return (
    <div className="space-y-8">
      <PageHeader title="Dokument" subtitle="Produktion, logistik och fraktsedlar. Inga priser eller fakturor." />
      {docs.length === 0 ? (
        <EmptyState title="Inga dokument" body="När jobb får artwork eller fraktsedel syns de här." />
      ) : (
        <Panel padded={false}>
          <ul className="divide-y divide-black/5">
            {docs.map((d) => (
              <li key={d.id} className="flex justify-between gap-4 px-5 py-3 text-sm">
                <FileLink href={`/api/documents/${d.id}`}>{d.title}</FileLink>
                <span className="font-mono text-[var(--av-text-muted)]">{d.order?.orderNo}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
