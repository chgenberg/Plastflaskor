import { DOCUMENT_KIND_LABELS } from "@/domain/enums";
import { requireRole } from "@/server/rbac";
import { listOrdersForCustomer } from "@/server/services/order.service";
import { DashList, DashRow, EmptyState, LinkButton, PageHeader } from "@/ui/shell/primitives";

export default async function KontoDocs() {
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const orders = user.customerId ? await listOrdersForCustomer(user.customerId) : [];
  const docs = orders.flatMap((o) => o.documents.map((d) => ({ ...d, orderNo: o.orderNo })));
  return (
    <div className="space-y-8">
      <PageHeader title="Dokument" subtitle="Korrektur, fraktsedlar och fakturor kopplade till era ordrar." />
      {!user.customerId ? (
        <EmptyState title="Inget kundkonto kopplat" body="Dokument visas för kundkonton." />
      ) : docs.length === 0 ? (
        <EmptyState title="Inga dokument" body="När en order får korrektur eller fraktsedel syns den här." />
      ) : (
        <DashList>
          {docs.map((d) => (
            <DashRow
              key={d.id}
              primary={d.title}
              columns={[DOCUMENT_KIND_LABELS[d.kind] ?? d.kind, d.orderNo, `v${d.version}`]}
              actions={
                <>
                  <LinkButton href={`/api/documents/${d.id}?inline=1`} variant="secondary" size="sm">
                    Visa
                  </LinkButton>
                  <LinkButton href={`/api/documents/${d.id}`} size="sm">
                    Ladda ner
                  </LinkButton>
                </>
              }
            />
          ))}
        </DashList>
      )}
    </div>
  );
}
