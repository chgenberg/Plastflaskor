import { notFound } from "next/navigation";
import { getOrderByNo, eventsFor, orderValue } from "@/server/services/order.service";
import { DOCUMENT_KIND_LABELS, ORDER_STEPS, ORDER_STEP_LABELS, REPEAT_HORIZONS, eventLabel } from "@/domain/enums";
import { orderBrief } from "@/domain/orderBrief";
import { buildPriceSnapshot, parseExtras, parseSnapshot } from "@/domain/extras";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { approveArtworkAction, approveFactoryDateAction, confirmDeliveryAction, createWaybillAction, opsAdvanceAction, saveExtrasAction, sendObAction, setFactoryDeadlineAction } from "@/actions";
import { DocumentUpload } from "@/ui/shell/DocumentUpload";
import { OrderConfirmationPreview } from "@/ui/order/OrderConfirmationPreview";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { Button, FileLink, LinkButton, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";
import { EXTRA_KINDS } from "@/domain/extras";

export default async function OpsOrderDetail({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const order = await getOrderByNo(orderNo);
  if (!order) notFound();
  const events = await eventsFor(order.id);
  const idx = ORDER_STEPS.indexOf(order.currentStatus);
  const value = orderValue(order);
  const brief = orderBrief(order.currentStatus, order.requestedDate);
  const extras = parseExtras(order.extrasJson);
  const snapshot =
    parseSnapshot(order.priceSnapshotJson) ??
    (order.lockedAt
      ? buildPriceSnapshot({
          lines: order.items.map((i) => ({
            name: i.variant.product.name,
            qty: i.qty,
            unitPriceExVat: i.unitPriceExVat,
          })),
          extras,
        })
      : null);
  const item = order.items[0];
  const spec = specFromOrderItem({
    visualSpecJson: order.visualSpecJson,
    item,
    imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
  });
  const sendingOb = order.currentStatus === "ARTWORK_CUSTOMER_APPROVAL";

  return (
    <div className="space-y-8">
      <PageHeader
        title={order.customer.name}
        subtitle={`${order.orderNo} · ${order.buyerType === "CUSTOMER" ? "Direktkund" : `ÅF: ${order.reseller?.company.name ?? "–"}`}`}
      />
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Panel title="Status">
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
          {order.currentStatus === "AQUA_REVIEW" ? (
            <Panel title="Granska och acceptera order">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Produkt</dt>
                  <dd className="mt-1 font-medium">{item?.variant.product.name ?? "–"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Antal</dt>
                  <dd className="mt-1 font-medium tabular-nums">{item ? `${item.qty.toLocaleString("sv-SE")} st` : "–"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Pris</dt>
                  <dd className="mt-1 font-medium tabular-nums">{value.toLocaleString("sv-SE")} kr ex moms</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Preliminärt datum</dt>
                  <dd className="mt-1 font-medium">{order.preliminaryDate ?? "Beräknas från ledtid"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Leveranskrav</dt>
                  <dd className="mt-1 font-medium">{order.deliveryRequirement ?? "Inget särskilt krav"}</dd>
                </div>
              </dl>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Kontrollera innan du accepterar</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {[
                  "Tryckfilens format och upplösning",
                  "Tryckytans mått och bleed",
                  "Obligatoriska tryckelement",
                  "Antal mot minsta order",
                  "Leveransadress och fakturareferens",
                ].map((check) => (
                  <li key={check} className="flex gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4d4d8]" />
                    {check}
                  </li>
                ))}
              </ul>
              <form action={opsAdvanceAction} className="mt-5">
                <input type="hidden" name="orderNo" value={order.orderNo} />
                <input type="hidden" name="toStatus" value="ARTWORK_AQUA_REVIEW" />
                <Button type="submit">Acceptera order</Button>
              </form>
            </Panel>
          ) : null}
          {spec && !sendingOb && !order.lockedAt ? <VisualSpecCard spec={spec} /> : null}
          {sendingOb || order.lockedAt ? (
            <OrderConfirmationPreview
              spec={spec}
              extras={extras}
              snapshot={snapshot}
              confirmedDate={order.confirmedDate ?? order.preliminaryDate}
              repeatHorizonMonths={order.repeatHorizonMonths}
              locked={Boolean(order.lockedAt)}
              lockedCopy="Låst snapshot. Ändringar via AquaVisibility."
            />
          ) : null}
          <Panel>
            <StatusChip status={order.currentStatus} label={ORDER_STEP_LABELS[order.currentStatus]} requestedDate={order.requestedDate} />
            <p className="mt-4 text-lg font-semibold tabular-nums">{value.toLocaleString("sv-SE")} kr ex moms</p>
            {order.deliveryRequirement ? <p className="mt-3 text-sm font-medium text-[var(--av-status-blocked-fg)]">Viktigt leveranskrav: {order.deliveryRequirement}</p> : null}

            {!order.lockedAt ? (
              <form action={saveExtrasAction} className="mt-5 grid gap-2 sm:grid-cols-2">
                <input type="hidden" name="orderNo" value={order.orderNo} />
                {EXTRA_KINDS.map((k) => {
                  const existing = extras.find((e) => e.kind === k.kind);
                  return (
                    <label key={k.kind} className="text-sm">
                      {k.label}
                      <input name={`extra_${k.kind}`} type="number" step="0.01" defaultValue={existing?.amountExVat ?? ""} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" />
                    </label>
                  );
                })}
                <div className="sm:col-span-2">
                  <Button type="submit" variant="secondary">Spara extrakostnader</Button>
                </div>
              </form>
            ) : null}

            {order.currentStatus === "ARTWORK_AQUA_REVIEW" ? (
              <form action={approveArtworkAction} className="mt-5">
                <input type="hidden" name="orderNo" value={order.orderNo} />
                <Button type="submit">Skicka korrektur till kund</Button>
              </form>
            ) : null}

            {sendingOb ? (
              <form action={sendObAction} className="mt-5 space-y-3">
                <input type="hidden" name="orderNo" value={order.orderNo} />
                <label className="block text-sm">
                  Bekräftat leveransdatum
                  <input name="confirmedDate" type="date" defaultValue={order.preliminaryDate ?? ""} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" required />
                </label>
                <label className="block text-sm">
                  Förväntad återbeställning
                  <select name="repeatHorizon" className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2">
                    {REPEAT_HORIZONS.map((m) => (
                      <option key={m} value={m}>
                        {m === 0 ? "Ingen förväntad repeat" : `${m} månader`}
                      </option>
                    ))}
                  </select>
                </label>
                <Button type="submit">Skicka slutlig OB och lås ordern</Button>
              </form>
            ) : null}

            {order.factoryReadyEstimate && !order.aquaApprovedDelivery ? (
              <form action={approveFactoryDateAction} className="mt-5 space-y-2">
                <input type="hidden" name="orderNo" value={order.orderNo} />
                <p className="text-sm">Tryckeriet föreslår {order.factoryReadyEstimate}.</p>
                <input name="date" type="date" defaultValue={order.factoryReadyEstimate} className="rounded-xl border border-black/10 px-3 py-2 text-sm" />
                <Button type="submit">Godkänn leveransdatum</Button>
              </form>
            ) : null}

            {order.currentStatus === "READY_TO_SHIP" ? (
              <form action={createWaybillAction} className="mt-5">
                <input type="hidden" name="orderNo" value={order.orderNo} />
                <Button type="submit">Skapa fraktsedel</Button>
              </form>
            ) : null}

            {order.currentStatus === "SHIPPED" ? (
              <form action={confirmDeliveryAction} className="mt-5">
                <input type="hidden" name="orderNo" value={order.orderNo} />
                <Button type="submit">Markera levererad</Button>
              </form>
            ) : null}

            {order.currentStatus === "CONFIRMED" ? (
              <form action={setFactoryDeadlineAction} className="mt-5 space-y-2">
                <input type="hidden" name="orderNo" value={order.orderNo} />
                {order.factoryDeadline ? (
                  <p className="text-sm text-[#6b7280]">Nuvarande deadline: {order.factoryDeadline}</p>
                ) : null}
                <label className="block text-sm">
                  Senaste utskick / produktionsdeadline
                  <input name="date" type="date" defaultValue={order.factoryDeadline ?? ""} className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2" />
                </label>
                <Button type="submit">Sätt deadline för tryckeriet</Button>
              </form>
            ) : null}

            {order.currentStatus === "READY_TO_INVOICE" || order.currentStatus === "DELIVERED" ? (
              <div className="mt-4">
                <LinkButton href={`/operations/ekonomi/${order.orderNo}/fakturera`}>Fakturera</LinkButton>
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
                <dt className="text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">När?</dt>
                <dd className="mt-1 font-medium">{order.aquaApprovedDelivery ?? brief.when}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.14em] text-[#6b7280]">Vem äger nästa steg?</dt>
                <dd className="mt-1 font-medium">{brief.owner || "—"}</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Tryckfil">
            {order.designs.length === 0 ? (
              <p className="text-sm text-[#6b7280]">Ingen tryckfil kopplad.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {order.designs.map((d) => (
                  <li key={d.id}>
                    <p className="font-medium">{d.projectName}</p>
                    {d.files.map((f) => (
                      <FileLink key={f.id} href={`/api/artwork-files/${f.id}`}>
                        {f.fileName}
                      </FileLink>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Dokument">
            <ul className="space-y-2 text-sm">
              {order.documents.map((d) => (
                <li key={d.id}>
                  <FileLink href={`/api/documents/${d.id}`}>
                    {DOCUMENT_KIND_LABELS[d.kind] ?? d.kind} · {d.title}
                  </FileLink>
                </li>
              ))}
            </ul>
            <DocumentUpload orderId={order.id} returnTo={`/operations/ordrar/${order.orderNo}`} allowFinance />
          </Panel>
          <Panel title="Eventlogg">
            <ol className="space-y-2 text-sm text-[#6b7280]">
              {events.map((e) => (
                <li key={e.id}>
                  {e.occurredAt.toLocaleString("sv-SE")} – {eventLabel(e.toStatus)}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}
