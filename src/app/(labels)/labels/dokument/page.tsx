import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { prisma } from "@/server/db";
import { EmptyState, FileLink, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function LabelsDocs() {
  const user = await requireSupplier("label");
  const factoryId = scopedFactoryId(user);
  if (user.role === "LABEL" && !user.factoryId) {
    return (
      <div className="space-y-8">
        <PageHeader title="Dokument" />
        <EmptyState title="Ingen etikettleverantör kopplad" body="Produktionsdokument visas här. Inga fakturor." />
      </div>
    );
  }
  const docs = await prisma.document.findMany({
    where: {
      kind: { in: ["PRODUCTION", "LOGISTICS", "ARTWORK"] },
      ...(factoryId ? { order: { jobs: { some: { factoryId } } } } : {}),
    },
    include: { order: true },
  });
  return (
    <div className="space-y-8">
      <PageHeader title="Dokument" subtitle="Etikettfiler och produktion. Inga priser eller fakturor." />
      {docs.length === 0 ? (
        <EmptyState title="Inga dokument" body="När jobb får slutgiltig artwork syns de här." />
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
