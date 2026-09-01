import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { prisma } from "@/server/db";
import { DashList, DashRow, EmptyState, LinkButton, PageHeader } from "@/ui/shell/primitives";

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
