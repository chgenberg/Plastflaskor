import { DOCUMENT_KIND_LABELS } from "@/domain/enums";
import { requireRole } from "@/server/rbac";
import { listOrdersForCustomer } from "@/server/services/order.service";
import { DashPage, DashTable, EmptyState, LinkButton, PageHeader, RowHit, TableActions } from "@/ui/shell/primitives";

export default async function KontoDocs() {
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const orders = user.customerId ? await listOrdersForCustomer(user.customerId) : [];
  const docs = orders.flatMap((o) => o.documents.map((d) => ({ ...d, orderNo: o.orderNo })));
  return (
    <DashPage>
      <PageHeader title="Dokument" subtitle="Korrektur, fraktsedlar och fakturor kopplade till era ordrar." />
      {!user.customerId ? (
        <EmptyState title="Inget kundkonto kopplat" body="Dokument visas för kundkonton." />
      ) : docs.length === 0 ? (
        <EmptyState title="Inga dokument" body="När en order får korrektur eller fraktsedel syns den här." />
      ) : (
        <DashTable
          count={`${docs.length} dokument`}
          columns={[
            { label: "Dokument" },
            { label: "Typ" },
            { label: "Order" },
            { label: "Version" },
            { label: "Åtgärd", sr: true },
          ]}
        >
          {docs.map((d) => (
            <tr key={d.id}>
              <td>
                <RowHit href={`/api/documents/${d.id}?inline=1`}>{d.title}</RowHit>
              </td>
              <td>{DOCUMENT_KIND_LABELS[d.kind] ?? d.kind}</td>
              <td>{d.orderNo}</td>
              <td className="tabular-nums text-[var(--av-text-muted)]">v{d.version}</td>
              <td className="av-actions">
                <TableActions>
                  <LinkButton href={`/api/documents/${d.id}`} size="sm">
                    Ladda ner
                  </LinkButton>
                </TableActions>
              </td>
            </tr>
          ))}
        </DashTable>
      )}
    </DashPage>
  );
}
