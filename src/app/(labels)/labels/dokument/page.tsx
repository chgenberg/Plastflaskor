import { listLabelDispatches } from "@/server/services/labelDispatch.service";
import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { DashPage, DashTable, EmptyState, PageHeader, RowHit } from "@/ui/shell/primitives";

export default async function LabelsReports() {
  const user = await requireSupplier("label");
  const factoryId = scopedFactoryId(user);
  if (user.role === "LABEL" && !user.factoryId) {
    return (
      <DashPage>
        <PageHeader title="Leveransrapport" />
        <EmptyState title="Ingen etikettleverantör kopplad" body="Leveransrapporter visas här. Inga fakturor." />
      </DashPage>
    );
  }
  const reports = await listLabelDispatches(factoryId, { chronological: true });
  return (
    <DashPage>
      <PageHeader
        title="Leveransrapport"
        subtitle="Skapade rapporter i tidsordning. Underlag utan priser."
      />
      {reports.length === 0 ? (
        <EmptyState
          title="Inga leveransrapporter ännu"
          body="När du skapar en leveransrapport på översikten hamnar den här."
        />
      ) : (
        <DashTable
          count={`${reports.length} rapporter`}
          columns={[
            { label: "Datum" },
            { label: "Rapport" },
            { label: "Tracking" },
            { label: "Ordrar" },
            { label: "Antal" },
          ]}
        >
          {reports.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap tabular-nums text-[var(--av-text-secondary)]">
                {new Date(r.createdAt).toLocaleString("sv-SE", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="tabular-nums">
                <RowHit href={r.documentId ? `/api/documents/${r.documentId}` : `/labels?rapport=${encodeURIComponent(r.reportNo)}`}>
                  {r.reportNo}
                </RowHit>
              </td>
              <td>{r.trackingNo}</td>
              <td>{r.orderNos.join(", ") || `${r.orderCount} ordrar`}</td>
              <td className="tabular-nums">{r.qty.toLocaleString("sv-SE")} st</td>
            </tr>
          ))}
        </DashTable>
      )}
    </DashPage>
  );
}
