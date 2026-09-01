import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { prisma } from "@/server/db";
import { DashList, DashRow, EmptyState, LinkButton, PageHeader } from "@/ui/shell/primitives";

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
        <DashList>
          {docs.map((d) => (
            <DashRow
              key={d.id}
              primary={d.title}
              primaryHref={`/api/documents/${d.id}`}
              columns={[d.order?.orderNo ?? "–"]}
              actions={
                <LinkButton href={`/api/documents/${d.id}`} variant="secondary" size="sm">
                  Öppna
                </LinkButton>
              }
            />
          ))}
        </DashList>
      )}
    </div>
  );
}
