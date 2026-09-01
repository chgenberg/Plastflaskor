import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { prisma } from "@/server/db";
import { DashTable, EmptyState, LinkButton, PageHeader, TableActions } from "@/ui/shell/primitives";

export default async function LabelsDocs() {
  const user = await requireSupplier("label");
  const factoryId = scopedFactoryId(user);
  if (user.role === "LABEL" && !user.factoryId) {
    return (
      <div className="space-y-4">
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
    <div className="space-y-4">
      <PageHeader title="Dokument" subtitle="Etikettfiler och produktion. Inga priser eller fakturor." />
      {docs.length === 0 ? (
        <EmptyState title="Inga dokument" body="När jobb får slutgiltig artwork syns de här." />
      ) : (
        <DashTable
          count={`${docs.length} dokument`}
          columns={[
            { label: "Dokument" },
            { label: "Order" },
            { label: "Åtgärd", sr: true },
          ]}
        >
          {docs.map((d) => (
            <tr key={d.id}>
              <td className="font-medium">{d.title}</td>
              <td>{d.order?.orderNo ?? "–"}</td>
              <td className="av-actions">
                <TableActions>
                  <LinkButton href={`/api/documents/${d.id}`} variant="secondary" size="sm">
                    Öppna
                  </LinkButton>
                </TableActions>
              </td>
            </tr>
          ))}
        </DashTable>
      )}
    </div>
  );
}
