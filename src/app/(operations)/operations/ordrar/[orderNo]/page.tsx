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
import { Button, Field, FileLink, LinkButton, NextStep, PageHeader, Panel, StatusChip, Timeline, controlClass } from "@/ui/shell/primitives";
import { EXTRA_KINDS } from "@/domain/extras";
import { orderArtworkLink } from "@/domain/orderArtwork";

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
  const customerFinal = order.artworkApprovals.some((a) => a.kind === "CUSTOMER_FINAL");
  const sendingOb = order.currentStatus === "ARTWORK_CUSTOMER_APPROVAL" && customerFinal;
  const awaitingCustomerProof = order.currentStatus === "ARTWORK_CUSTOMER_APPROVAL" && !customerFinal;
  const artwork = orderArtworkLink(order);

  return (
    <div className="space-y-7">
      <PageHeader
        title={order.orderNo}
        subtitle={`${order.customer.name}${item ? ` · ${item.variant.product.name}` : ""}`}
      />
      <NextStep title={brief.now} body={`${brief.owner}. ${brief.must}`} tone={brief.overdue ? "blocked" : "next"} />
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Panel title="Status">
          <Timeline
            steps={ORDER_STEPS.map((s, i) => ({
              id: s,
              label: ORDER_STEP_LABELS[s],
              done: i < idx,
              current: i === idx,
            }))}
          />
        </Panel>
        <div className="space-y-5">
          {order.currentStatus === "AQUA_REVIEW" ? (
            <Panel title="Nya ordrar att granska">
              {spec ? (
                <div className="mb-5">
                  <VisualSpecCard spec={spec} compact />
                </div>
              ) : null}
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Field label="Produkt">{item?.variant.product.name ?? "–"}</Field>
                <Field label="Antal">{item ? `${item.qty.toLocaleString("sv-SE")} st` : "–"}</Field>
                <Field label="Pris">{value.toLocaleString("sv-SE")} kr ex moms</Field>
                <Field label="Spec">{spec ? [spec.volumeLabel, spec.waterType, spec.bottleColor, spec.cap].filter(Boolean).join(" · ") : "–"}</Field>
                <Field label="Preliminärt datum">{order.preliminaryDate ?? "Beräknas från ledtid"}</Field>
                <Field label="Fakturareferens">{order.invoiceRef ?? "–"}</Field>
                <div className="sm:col-span-2">
                  <Field label="Leveransadress">
                    {order.shippingAddress
                      ? `${order.shippingAddress.line1}, ${order.shippingAddress.postalCode} ${order.shippingAddress.city}`
                      : "–"}
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Leveranskrav">{order.deliveryRequirement ?? "Inget särskilt krav"}</Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Övriga instruktioner">{order.notes ?? "Inga"}</Field>
                </div>
              </dl>
              <p className="av-label mt-5">Kontrollera innan du accepterar</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {[
                  "Etikettens format, bleed och safe area",
                  "Obligatoriska etikettelement (volym, EAN, pant, producent)",
                  "Teknisk produktionsbarhet",
                  "Antal mot minsta order",
                  "Leveransadress och fakturareferens",
                ].map((check) => (
                  <li key={check} className="flex gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--av-gray-200)]" />
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
          {awaitingCustomerProof ? (
            <NextStep title="Väntar på kundgodkännande" body="När kunden godkänt korrektur kan du välja repeat och skicka slutlig OB." tone="next" />
          ) : null}
          {sendingOb || order.lockedAt ? (
            <OrderConfirmationPreview
              spec={spec}
              extras={extras}
              snapshot={snapshot}
              confirmedDate={order.confirmedDate ?? order.preliminaryDate}
              repeatHorizonMonths={order.repeatHorizonMonths}
              locked={Boolean(order.lockedAt)}
              lockedCopy="Ordern är godkänd och låst. Kontakta AquaVisibility för ändringar."
              orderNo={order.orderNo}
              customer={order.customer.name}
              address={
                order.shippingAddress
                  ? `${order.shippingAddress.line1}, ${order.shippingAddress.postalCode} ${order.shippingAddress.city}`
                  : undefined
              }
              invoiceRef={order.invoiceRef}
              artworkHref={artwork?.href}
              artworkLabel={artwork?.label}
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
                      <input name={`extra_${k.kind}`} type="number" step="0.01" defaultValue={existing?.amountExVat ?? ""} className={`${controlClass} mt-1`} />
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
                  <input name="confirmedDate" type="date" defaultValue={order.preliminaryDate ?? ""} className={`${controlClass} mt-1`} required />
                </label>
                <label className="block text-sm">
                  När tror du att denna order kan vara aktuell för repeat?
                  <select name="repeatHorizon" className={`${controlClass} mt-1`}>
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
                <p className="text-sm">Bottler föreslår {order.factoryReadyEstimate}.</p>
                <input name="date" type="date" defaultValue={order.factoryReadyEstimate} className={controlClass} />
                <Button type="submit">Godkänn leveransdatum</Button>
              </form>
            ) : null}

            {order.currentStatus === "READY_TO_SHIP" ? (
              <form action={createWaybillAction} className="mt-5 space-y-2">
                <input type="hidden" name="orderNo" value={order.orderNo} />
                <label className="block text-sm">
                  Transportör
                  <input name="carrier" defaultValue="PostNord" className={`${controlClass} mt-1`} required />
                </label>
                <label className="block text-sm">
                  Kolli
                  <input name="packages" type="number" min={1} defaultValue={1} className={`${controlClass} mt-1`} required />
                </label>
                <label className="block text-sm">
                  Vikt (kg)
                  <input name="weightKg" type="number" min={1} defaultValue={20} className={`${controlClass} mt-1`} required />
                </label>
                <Button type="submit">Skapa fraktsedel</Button>
              </form>
            ) : null}

            {order.currentStatus === "SHIPPED" ? (
              <form action={confirmDeliveryAction} className="mt-5">
                <input type="hidden" name="orderNo" value={order.orderNo} />
                <Button type="submit">Markera levererad</Button>
              </form>
            ) : null}

            {order.currentStatus === "CONFIRMED" || order.currentStatus === "LABEL_PRODUCTION" ? (
              <form action={setFactoryDeadlineAction} className="mt-5 space-y-2">
                <input type="hidden" name="orderNo" value={order.orderNo} />
                {order.factoryDeadline ? (
                  <p className="text-sm text-[var(--av-text-muted)]">Nuvarande sista skickdatum: {order.factoryDeadline}</p>
                ) : null}
                <label className="block text-sm">
                  Sista skickdatum för etikett
                  <input name="date" type="date" defaultValue={order.factoryDeadline ?? ""} className={`${controlClass} mt-1`} />
                </label>
                <Button type="submit">Sätt sista skickdatum</Button>
              </form>
            ) : null}

            {order.currentStatus === "READY_TO_INVOICE" || order.currentStatus === "DELIVERED" ? (
              <div className="mt-4">
                <LinkButton href={`/operations/ekonomi/${order.orderNo}/fakturera`}>Fakturera</LinkButton>
              </div>
            ) : null}
          </Panel>
          <Panel title="Artwork">
            {order.designs.length === 0 ? (
              <p className="text-sm text-[var(--av-text-muted)]">Ingen artwork kopplad.</p>
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
            <ol className="space-y-2 text-sm text-[var(--av-text-muted)]">
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
