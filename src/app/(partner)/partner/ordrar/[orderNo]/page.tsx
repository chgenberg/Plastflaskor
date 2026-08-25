import { notFound } from "next/navigation";
import { getOrderByNo, eventsFor } from "@/server/services/order.service";
import { requireRole } from "@/server/rbac";
import { ArtworkUpload } from "@/ui/shell/ArtworkUpload";
import { DocumentUpload } from "@/ui/shell/DocumentUpload";
import { EmptyState, FileLink, LinkButton, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";
import { ORDER_STEP_LABELS, RESELLER_STATUS } from "@/domain/enums";

export default async function PartnerOrderDetail({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const order = await getOrderByNo(orderNo);
  if (!order || (user.role === "RESELLER" && order.resellerId !== user.resellerId)) notFound();
  const events = await eventsFor(order.id);
  const value = order.items.reduce((s, i) => s + i.unitPriceExVat * i.qty, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title={order.customer.name}
        subtitle={order.orderNo}
        action={<LinkButton href={`/partner/ordrar/${order.orderNo}/repeat`}>Beställ igen</LinkButton>}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Order">
          <StatusChip status={order.currentStatus} label={RESELLER_STATUS[order.currentStatus]} requestedDate={order.requestedDate} />
          <p className="mt-4 text-[15px]">
            {order.items[0]?.qty} × {order.items[0]?.variant.product.name}
          </p>
          <p className="mt-1 text-sm text-[#6b7280]">
            {order.shippingAddress.line1}, {order.shippingAddress.postalCode} {order.shippingAddress.city}
          </p>
          {order.invoiceRef ? <p className="mt-2 text-sm">Fakturareferens: {order.invoiceRef}</p> : null}
          <p className="mt-1 text-sm text-[#6b7280]">Önskad leverans: {order.requestedDate ?? "–"}</p>
          <p className="mt-4 text-lg font-semibold tabular-nums">{value.toLocaleString("sv-SE")} kr</p>
        </Panel>
        <Panel title="Design / artwork">
          {order.designs.length === 0 ? (
            <p className="text-sm text-[#6b7280]">Ingen design kopplad.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {order.designs.map((d) => (
                <li key={d.id}>
                  <p className="font-medium">{d.projectName}</p>
                  <p className="text-[#6b7280]">
                    {d.quantity} st · {d.status}
                    {d.files.length ? ` · ${d.files.length} filer` : ""}
                  </p>
                  {d.files.map((f) => (
                    <p key={f.id} className="mt-1">
                      <FileLink href={`/api/artwork-files/${f.id}`}>{f.fileName}</FileLink>
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          )}
          {order.currentStatus === "ORDER_RECEIVED" || order.currentStatus === "ARTWORK_UPLOADED" ? (
            <ArtworkUpload orderId={order.id} returnTo={`/partner/ordrar/${order.orderNo}`} />
          ) : null}
        </Panel>
        <Panel title="Dokument">
          {order.documents.length === 0 ? (
            <p className="text-sm text-[#6b7280]">Inga dokument ännu.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {order.documents.map((d) => (
                <li key={d.id} className="flex flex-wrap gap-3">
                  <FileLink href={`/api/documents/${d.id}`}>{d.title}</FileLink>
                  <FileLink href={`/api/documents/${d.id}?inline=1`}>Förhandsvisa</FileLink>
                  <span className="text-[#6b7280]">v{d.version}</span>
                </li>
              ))}
            </ul>
          )}
          <DocumentUpload orderId={order.id} returnTo={`/partner/ordrar/${order.orderNo}`} />
        </Panel>
        <Panel title="Tidslinje">
          {events.length === 0 ? (
            <EmptyState title="Ingen historik" body="Statushändelser visas när ordern rör sig framåt." />
          ) : (
            <ol className="space-y-3 text-sm">
              {events.map((e) => (
                <li key={e.id}>
                  <p className="font-medium">{ORDER_STEP_LABELS[e.toStatus as keyof typeof ORDER_STEP_LABELS] ?? e.toStatus}</p>
                  <p className="text-[12px] text-[#6b7280]">{e.occurredAt.toLocaleString("sv-SE")}</p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}
