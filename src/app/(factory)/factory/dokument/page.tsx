import { requireRole } from "@/server/rbac";
import { prisma } from "@/server/db";
import { EmptyState, FileLink, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function FactoryDocs() {
  const user = await requireRole(["FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]);
  if (!user.factoryId && user.role === "FACTORY") {
    return (
      <div className="space-y-8">
        <PageHeader title="Dokument" />
        <EmptyState title="Ingen fabrik kopplad" body="Produktions- och logistikdokument visas för fabrikskonton." />
      </div>
    );
  }
  const docs = await prisma.document.findMany({
    where: {
      kind: { in: ["PRODUCTION", "LOGISTICS", "ARTWORK", "WAYBILL"] },
      ...(user.factoryId ? { order: { factoryId: user.factoryId } } : {}),
    },
    include: { order: true },
  });
  return (
    <div className="space-y-8">
      <PageHeader title="Dokument" subtitle="Produktion, logistik och fraktsedlar. Inga fakturor." />
      {docs.length === 0 ? (
        <EmptyState title="Inga dokument" body="När jobb får underlag syns de här. Inga priser eller fakturor." />
      ) : (
        <Panel padded={false}>
          <ul className="divide-y divide-black/5">
            {docs.map((d) => (
              <li key={d.id} className="flex justify-between gap-4 px-5 py-3 text-sm">
                <FileLink href={`/api/documents/${d.id}`}>{d.title}</FileLink>
                <span className="font-mono text-[#6b7280]">{d.order?.orderNo}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
