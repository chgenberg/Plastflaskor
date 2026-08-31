import { DOCUMENT_KIND_LABELS } from "@/domain/enums";
import { requireRole } from "@/server/rbac";
import { listOrdersForCustomer } from "@/server/services/order.service";
import { EmptyState, FileLink, PageHeader } from "@/ui/shell/primitives";

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
        <div className="space-y-4">
          {docs.map((d) => (
            <article key={d.id} className="rounded-[22px] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.04)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="inline-flex rounded-full bg-[#E8EEFA] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#3B5BAA]">
                    {DOCUMENT_KIND_LABELS[d.kind] ?? d.kind}
                  </span>
                  <p className="mt-2">
                    <FileLink href={`/api/documents/${d.id}`}>{d.title}</FileLink>
                    <span className="ml-2 text-sm text-[#6b7280]">v{d.version}</span>
                  </p>
                </div>
                <span className="font-mono text-sm text-[#6b7280]">{d.orderNo}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <FileLink href={`/api/documents/${d.id}?inline=1`}>Förhandsvisa</FileLink>
                <FileLink href={`/api/documents/${d.id}`}>Ladda ner</FileLink>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
