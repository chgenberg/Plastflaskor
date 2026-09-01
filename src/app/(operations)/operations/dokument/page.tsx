import { listBottlerInvoices } from "@/server/services/bottlerInvoice.service";
import { listLabelDispatches } from "@/server/services/labelDispatch.service";
import { DashPage, DashTable, EmptyState, LinkButton, PageHeader, SectionTitle, TableActions } from "@/ui/shell/primitives";

export default async function OpsDocumentsPage() {
  const [labels, bottler] = await Promise.all([
    listLabelDispatches(undefined, { chronological: false }),
    listBottlerInvoices(undefined, { chronological: false }),
  ]);

  return (
    <DashPage>
      <PageHeader
        title="Dokument"
        subtitle="Leverantörsunderlag. Etikett och bottler ser aldrig kr. Här öppnar Aqua samma PDF."
      />
      <section className="space-y-2">
        <SectionTitle>Etikett · leveransrapport</SectionTitle>
        {labels.length === 0 ? (
          <EmptyState title="Inga leveransrapporter" body="När etikettproducenten skapar en rapport syns den här." />
        ) : (
          <DashTable
            count={`${labels.length} rapporter`}
            columns={[
              { label: "Datum" },
              { label: "Rapport" },
              { label: "Tracking" },
              { label: "Ordrar" },
              { label: "Antal" },
              { label: "Åtgärd", sr: true },
            ]}
          >
            {labels.map((r) => (
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
                <td className="font-semibold tabular-nums">{r.reportNo}</td>
                <td>{r.trackingNo}</td>
                <td>{r.orderNos.join(", ") || `${r.orderCount} ordrar`}</td>
                <td className="tabular-nums">{r.qty.toLocaleString("sv-SE")} st</td>
                <td className="av-actions">
                  <TableActions>
                    {r.documentId ? (
                      <LinkButton href={`/api/documents/${r.documentId}`} variant="secondary" size="sm">
                        Öppna
                      </LinkButton>
                    ) : null}
                  </TableActions>
                </td>
              </tr>
            ))}
          </DashTable>
        )}
      </section>
      <section className="space-y-2">
        <SectionTitle>Bottler · fakturaunderlag</SectionTitle>
        {bottler.length === 0 ? (
          <EmptyState title="Inga bottler-underlag" body="När bottler skapar underlag för tappning syns det här." />
        ) : (
          <DashTable
            count={`${bottler.length} underlag`}
            columns={[
              { label: "Datum" },
              { label: "Underlag" },
              { label: "Ordrar" },
              { label: "Antal" },
              { label: "Åtgärd", sr: true },
            ]}
          >
            {bottler.map((r) => (
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
                <td className="font-semibold tabular-nums">{r.reportNo}</td>
                <td>{r.orderNos.join(", ") || `${r.orderCount} ordrar`}</td>
                <td className="tabular-nums">{r.qty.toLocaleString("sv-SE")} st</td>
                <td className="av-actions">
                  <TableActions>
                    {r.documentId ? (
                      <LinkButton href={`/api/documents/${r.documentId}`} variant="secondary" size="sm">
                        Öppna
                      </LinkButton>
                    ) : null}
                  </TableActions>
                </td>
              </tr>
            ))}
          </DashTable>
        )}
      </section>
    </DashPage>
  );
}
