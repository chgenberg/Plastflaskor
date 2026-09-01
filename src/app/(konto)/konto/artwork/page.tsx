import { requireRole } from "@/server/rbac";
import { listDesignsForUser } from "@/server/services/document.service";
import { DESIGN_STATUS_LABELS } from "@/domain/enums";
import { DashList, DashRow, EmptyState, LinkButton, PageHeader, StatusChip } from "@/ui/shell/primitives";

export default async function KontoArtworkPage() {
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const designs = await listDesignsForUser(user);
  return (
    <div className="space-y-8">
      <PageHeader
        title="Artwork"
        subtitle="Era artwork-filer och tidigare designer."
        action={<LinkButton href="/designa">Ny design</LinkButton>}
      />
      {designs.length === 0 ? (
        <EmptyState title="Ingen artwork ännu" body="Ladda upp i studion eller koppla en fil till en order." />
      ) : (
        <DashList>
          {designs.map((d) => (
            <DashRow
              key={d.id}
              primary={d.projectName}
              columns={[d.order?.orderNo ?? "Ingen order", d.files[0]?.fileName ?? "Inga filer"]}
              status={<StatusChip status={d.status} label={DESIGN_STATUS_LABELS[d.status] ?? "Utkast"} />}
              actions={
                d.files[0] ? (
                  <LinkButton href={`/api/artwork-files/${d.files[0].id}`} variant="secondary" size="sm">
                    Öppna fil
                  </LinkButton>
                ) : (
                  <LinkButton href="/designa" size="sm">
                    Designa
                  </LinkButton>
                )
              }
            />
          ))}
        </DashList>
      )}
    </div>
  );
}
