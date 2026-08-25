import { requireRole } from "@/server/rbac";
import { listOrdersForReseller } from "@/server/services/order.service";
import { DocumentUpload } from "@/ui/shell/DocumentUpload";
import { EmptyState, FileLink, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function DocsPage() {
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const orders = user.resellerId ? await listOrdersForReseller(user.resellerId) : [];
  const docs = orders.flatMap((o) => o.documents.map((d) => ({ ...d, orderNo: o.orderNo })));
  return (
    <div className="space-y-8">
      <PageHeader title="Dokument" subtitle="Offerter, korrektur, fraktsedlar och fakturor kopplade till era ordrar." />
      {!user.resellerId ? (
        <EmptyState title="Ingen återförsäljare kopplad" body="Dokument visas för ÅF-konton." />
      ) : docs.length === 0 ? (
        <EmptyState title="Inga dokument" body="När en order får korrektur eller fraktsedel syns den här." />
      ) : (
        <Panel padded={false}>
          <ul className="divide-y divide-black/5">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 text-sm">
                <span>
                  <FileLink href={`/api/documents/${d.id}`}>{d.title}</FileLink>
                  <span className="ml-2 text-[#6b7280]">v{d.version}</span>
                  {" · "}
                  <FileLink href={`/api/documents/${d.id}?inline=1`}>Förhandsvisa</FileLink>
                </span>
                <span className="font-mono text-[#6b7280]">{d.orderNo}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {user.resellerId && orders[0] ? (
        <Panel title="Ladda upp dokument">
          <DocumentUpload orderId={orders[0].id} returnTo="/partner/dokument" />
          <p className="mt-2 text-[12px] text-[#6b7280]">Bifogas senaste ordern ({orders[0].orderNo}). Öppna en order för att ladda upp där.</p>
        </Panel>
      ) : null}
    </div>
  );
}
