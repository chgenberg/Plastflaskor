import { requireRole } from "@/server/rbac";
import { listOrdersForReseller } from "@/server/services/order.service";
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
              <li key={d.id} className="flex justify-between gap-4 px-5 py-3 text-sm">
                <FileLink href={`/api/documents/${d.id}`}>{d.title}</FileLink>
                <span className="font-mono text-[#6b7280]">{d.orderNo}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
