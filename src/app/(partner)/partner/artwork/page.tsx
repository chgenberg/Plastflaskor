import { requireRole } from "@/server/rbac";
import { listDesignsForUser } from "@/server/services/document.service";
import { EmptyState, FileLink, LinkButton, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function ArtworkPage() {
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const designs = await listDesignsForUser(user);
  return (
    <div className="space-y-8">
      <PageHeader
        title="Artwork"
        subtitle={user.role === "RESELLER" ? "Era mallar och tidigare designer." : "Alla designer i systemet."}
        action={<LinkButton href="/designa">Ny design</LinkButton>}
      />
      {designs.length === 0 ? (
        <EmptyState title="Inga designer ännu" body="Starta i studion för att lägga upp logo och bakgrund." />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {designs.map((d) => (
            <Panel key={d.id}>
              <p className="font-medium">{d.projectName}</p>
              <p className="mt-1 text-xs text-[#6b7280]">
                {d.status}
                {d.order?.orderNo ? ` · ${d.order.orderNo}` : ""}
              </p>
              {d.files.length === 0 ? (
                <p className="mt-3 text-sm text-[#6b7280]">Inga filer.</p>
              ) : (
                <ul className="mt-3 space-y-1 text-sm">
                  {d.files.map((f) => (
                    <li key={f.id}>
                      <FileLink href={`/api/artwork-files/${f.id}`}>{f.fileName}</FileLink>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
