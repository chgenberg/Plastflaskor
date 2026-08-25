import { notFound } from "next/navigation";
import { getOrderByNo, eventsFor } from "@/server/services/order.service";
import { ORDER_STEPS, ORDER_STEP_LABELS } from "@/domain/enums";
import { orderBrief } from "@/domain/orderBrief";
import { approveArtworkAction, confirmDeliveryAction, opsAdvanceAction } from "@/actions";
import { DocumentUpload } from "@/ui/shell/DocumentUpload";
import { Button, FileLink, LinkButton, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";

export default async function OpsOrderDetail({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const order = await getOrderByNo(orderNo);
  if (!order) notFound();
  const events = await eventsFor(order.id);
  const idx = ORDER_STEPS.indexOf(order.currentStatus);
  const next = ORDER_STEPS[idx + 1];
  const value = order.items.reduce((s, i) => s + i.unitPriceExVat * i.qty, 0);
  const brief = orderBrief(order.currentStatus, order.requestedDate);

  return (
    <div className="space-y-8">
      <PageHeader title={order.customer.name} subtitle={`${order.orderNo} · ÅF: ${order.reseller.company.name}`} />
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Panel title="Produktionsstatus">
          <ol className="space-y-2 text-sm">
            {ORDER_STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${i < idx ? "bg-[#16a34a]" : i === idx ? "bg-[#d97706]" : "bg-[#d4d4d8]"}`} />
                <span className={i === idx ? "font-medium" : "text-[#6b7280]"}>{ORDER_STEP_LABELS[s]}</span>
              </li>
            ))}
          </ol>
        </Panel>
        <div className="space-y-5">
          <Panel>
            <StatusChip status={order.currentStatus} label={ORDER_STEP_LABELS[order.currentStatus]} requestedDate={order.requestedDate} />
            <p className="mt-4 text-[15px]">
              {order.items[0]?.qty} × {order.items[0]?.variant.product.name}
            </p>
            <p className="mt-2 text-lg font-semibold tabular-nums">{value.toLocaleString("sv-SE")} kr</p>
            {brief.overdue ? <p className="mt-3 text-sm font-medium text-[var(--av-status-blocked-fg)]">Försenad mot {brief.when}.</p> : null}
            {order.currentStatus === "ARTWORK_UPLOADED" ? (
              <form action={approveArtworkAction} className="mt-5">
                <input type="hidden" name="orderNo" value={order.orderNo} />
                <Button type="submit">Godkänn artwork</Button>
              </form>
            ) : null}
            {order.currentStatus === "SHIPPED_TO_END_CUSTOMER" ? (
              <form action={confirmDeliveryAction} className="mt-5">
                <input type="hidden" name="orderNo" value={order.orderNo} />
                <Button type="submit">Synka leverans (levererad + redo att fakturera)</Button>
              </form>
            ) : null}
            {next ? (
              <form action={opsAdvanceAction} className="mt-5">
                <input type="hidden" name="orderNo" value={order.orderNo} />
                <input type="hidden" name="toStatus" value={next} />
                <Button type="submit">Markera: {ORDER_STEP_LABELS[next]}</Button>
              </form>
            ) : null}
            {order.currentStatus === "READY_TO_INVOICE" || order.currentStatus === "DELIVERED" ? (
              <div className="mt-4">
                <LinkButton href={`/operations/ekonomi/${order.orderNo}/fakturera`}>Slutför order & fakturera</LinkButton>
              </div>
            ) : null}
          </Panel>
          <Panel title="Fem frågor">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">Vad händer nu?</dt>
                <dd className="mt-1 font-medium">{brief.now}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">Vad måste hända?</dt>
                <dd className="mt-1 font-medium">{brief.must}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">Vem väntar vi på?</dt>
                <dd className="mt-1 font-medium">{brief.waiting}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">Vem äger steget?</dt>
                <dd className="mt-1 font-medium">{brief.owner}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">När ska det vara klart?</dt>
                <dd className="mt-1 font-medium">{brief.when}</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Artwork">
            {order.designs.length === 0 ? (
              <p className="text-sm text-[#6b7280]">Ingen design kopplad.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {order.designs.map((d) => (
                  <li key={d.id}>
                    <p className="font-medium">{d.projectName}</p>
                    {d.files.length === 0 ? (
                      <p className="text-[#6b7280]">Inga filer.</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {d.files.map((f) => (
                          <li key={f.id} className="flex gap-3">
                            <FileLink href={`/api/artwork-files/${f.id}`}>{f.fileName}</FileLink>
                            <FileLink href={`/api/artwork-files/${f.id}?inline=1`}>Förhandsvisa</FileLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Spårning">
            {order.shipments.length === 0 ? (
              <p className="text-sm text-[#6b7280]">Ingen sändning ännu.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {order.shipments.map((s) => (
                  <li key={s.id}>
                    <p className="font-mono">{s.trackingNo ?? s.waybillNo}</p>
                    <p className="text-[#6b7280]">
                      {s.carrier} · {s.packages} kolli · {s.weightKg} kg · {s.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Dokument">
            {order.documents.length === 0 ? (
              <p className="text-sm text-[#6b7280]">Inga dokument ännu.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {order.documents.map((d) => (
                  <li key={d.id} className="flex flex-wrap gap-3">
                    <FileLink href={`/api/documents/${d.id}`}>
                      {d.kind}: {d.title} (v{d.version})
                    </FileLink>
                    <FileLink href={`/api/documents/${d.id}?inline=1`}>Förhandsvisa</FileLink>
                  </li>
                ))}
              </ul>
            )}
            <DocumentUpload orderId={order.id} returnTo={`/operations/ordrar/${order.orderNo}`} allowFinance />
          </Panel>
          <Panel title="Eventlogg">
            <ol className="space-y-2 text-sm text-[#6b7280]">
              {events.map((e) => (
                <li key={e.id}>
                  {e.occurredAt.toLocaleString("sv-SE")} – {ORDER_STEP_LABELS[e.toStatus as keyof typeof ORDER_STEP_LABELS] ?? e.toStatus}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}
