import { requireRole } from "@/server/rbac";
import { listDesignsForUser } from "@/server/services/document.service";
import { DESIGN_STATUS_LABELS } from "@/domain/enums";
import { DashPage, DashTable, EmptyState, LinkButton, PageHeader, RowHit, StatusChip, TableActions } from "@/ui/shell/primitives";

export default async function KontoArtworkPage() {
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const designs = await listDesignsForUser(user);
  return (
    <DashPage>
      <PageHeader
        title="Artwork"
        subtitle="Era artwork-filer och tidigare designer."
        action={<LinkButton href="/designa">Ny design</LinkButton>}
      />
      {designs.length === 0 ? (
        <EmptyState title="Ingen artwork ännu" body="Ladda upp i studion eller koppla en fil till en order." />
      ) : (
        <DashTable
          count={`${designs.length} design${designs.length === 1 ? "" : "er"}`}
          columns={[
            { label: "Projekt" },
            { label: "Order" },
            { label: "Fil" },
            { label: "Status" },
            { label: "Åtgärd", sr: true },
          ]}
        >
          {designs.map((d) => (
            <tr key={d.id}>
              <td>
                <RowHit href={d.files[0] ? `/api/artwork-files/${d.files[0].id}` : "/designa"}>{d.projectName}</RowHit>
              </td>
              <td>{d.order?.orderNo ?? "–"}</td>
              <td className="text-[var(--av-text-secondary)]">{d.files[0]?.fileName ?? "Inga filer"}</td>
              <td>
                <StatusChip status={d.status} label={DESIGN_STATUS_LABELS[d.status] ?? "Utkast"} />
              </td>
              <td className="av-actions">
                {!d.files[0] ? (
                  <TableActions>
                    <LinkButton href="/designa" size="sm">
                      Designa
                    </LinkButton>
                  </TableActions>
                ) : null}
              </td>
            </tr>
          ))}
        </DashTable>
      )}
    </DashPage>
  );
}
