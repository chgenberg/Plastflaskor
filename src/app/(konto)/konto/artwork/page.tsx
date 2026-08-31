import { requireRole } from "@/server/rbac";
import { listDesignsForUser } from "@/server/services/document.service";
import { DESIGN_STATUS_LABELS } from "@/domain/enums";
import { ArtworkUpload } from "@/ui/shell/ArtworkUpload";
import { EmptyState, FileLink, LinkButton, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";

export default async function KontoArtworkPage() {
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const designs = await listDesignsForUser(user);
  return (
    <div className="space-y-8">
      <PageHeader
        title="Artwork"
        subtitle="Era tryckfiler och tidigare designer."
        action={<LinkButton href="/designa">Ny design</LinkButton>}
      />
      {designs.length === 0 ? (
        <EmptyState title="Inga tryckfiler ännu" body="Ladda upp i studion eller koppla en fil till en order." />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {designs.map((d) => (
            <Panel key={d.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="av-label">Design</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight">{d.projectName}</h2>
                </div>
                <StatusChip status={d.status} label={DESIGN_STATUS_LABELS[d.status] ?? "Utkast"} />
              </div>
              {d.order?.orderNo ? (
                <p className="mt-3 font-mono text-sm text-[var(--av-text-muted)]">{d.order.orderNo}</p>
              ) : null}
              {d.files.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--av-text-muted)]">Inga filer.</p>
              ) : (
                <ul className="mt-3 space-y-1 text-sm">
                  {d.files.map((f) => (
                    <li key={f.id}>
                      <FileLink href={`/api/artwork-files/${f.id}`}>{f.fileName}</FileLink>
                    </li>
                  ))}
                </ul>
              )}
              {d.order?.id && ["SUBMITTED", "AQUA_REVIEW", "ARTWORK_AQUA_REVIEW"].includes(d.order.currentStatus) ? (
                <ArtworkUpload orderId={d.order.id} returnTo="/konto/artwork" />
              ) : null}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
