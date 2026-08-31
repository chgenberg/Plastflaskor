import { DOCUMENT_KIND_LABELS } from "@/domain/enums";
import { requireRole } from "@/server/rbac";
import { listOrdersForReseller } from "@/server/services/order.service";
import { EmptyState, FileLink, PageHeader } from "@/ui/shell/primitives";

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
        <div className="space-y-4">
          {docs.map((d) => (
            <article key={d.id} className="av-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="inline-flex rounded-full bg-[var(--av-accent-soft)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--av-accent)]">
                    {DOCUMENT_KIND_LABELS[d.kind] ?? d.kind}
                  </span>
                  <p className="mt-2">
                    <FileLink href={`/api/documents/${d.id}`}>{d.title}</FileLink>
                    <span className="ml-2 text-sm text-[var(--av-text-muted)]">v{d.version}</span>
                  </p>
                </div>
                <span className="font-mono text-sm text-[var(--av-text-muted)]">{d.orderNo}</span>
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
