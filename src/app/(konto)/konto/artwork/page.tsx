import { requireRole } from "@/server/rbac";
import { listDesignsForUser } from "@/server/services/document.service";
import { listOrdersForCustomer } from "@/server/services/order.service";
import { DESIGN_STATUS_LABELS } from "@/domain/enums";
import { customerActionFor } from "@/domain/orderBrief";
import { findKontoOrder, kontoPeekHref } from "@/ui/order/KontoOrderPeek";
import { ArtworkUpload } from "@/ui/shell/ArtworkUpload";
import {
  DashPage,
  DashTable,
  EmptyState,
  LinkButton,
  NeedsAttention,
  PageHeader,
  RowHit,
  StatusChip,
  StepIndicator,
  TableActions,
} from "@/ui/shell/primitives";

const POST_STEPS = [
  { id: "ordered", label: "Beställd" },
  { id: "artwork", label: "Artwork" },
  { id: "proof", label: "Korr" },
  { id: "ob", label: "OB" },
];

export default async function KontoArtworkPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNo } = await searchParams;
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const [designs, orders] = await Promise.all([
    listDesignsForUser(user),
    user.customerId ? listOrdersForCustomer(user.customerId) : Promise.resolve([]),
  ]);
  const missing = orders.filter((o) => customerActionFor(o) === "artwork");
  const selected = findKontoOrder(orders, orderNo);
  return (
    <DashPage>
      <PageHeader
        title="Artwork"
        subtitle="Era artwork-filer och tidigare designer."
        action={<LinkButton href="/designa">Ny design</LinkButton>}
      />
      <NeedsAttention
        items={missing.map((o) => ({
          key: o.id,
          href: kontoPeekHref("/konto/ordrar", o.orderNo, { steg: "artwork" }),
          label: `${o.orderNo} saknar artwork`,
        }))}
      />
      {selected && customerActionFor(selected) === "artwork" ? (
        <>
          <StepIndicator steps={POST_STEPS} current="artwork" />
          <ArtworkUpload orderId={selected.id} returnTo={kontoPeekHref("/konto/ordrar", selected.orderNo)} />
        </>
      ) : null}
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
