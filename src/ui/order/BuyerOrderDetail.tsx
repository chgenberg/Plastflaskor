import { customerApproveProofAction } from "@/actions";
import { BUYER_STATUS, invoiceBuyerLabel } from "@/domain/enums";
import { buyerTimeline, shipmentTrackingSteps } from "@/domain/orderBrief";
import { buildPriceSnapshot, parseExtras, parseSnapshot } from "@/domain/extras";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { OrderConfirmationPreview } from "@/ui/order/OrderConfirmationPreview";
import { ArtworkUpload } from "@/ui/shell/ArtworkUpload";
import { Button, Field, FileLink, NextStep, PageHeader, Panel, StatusChip, Timeline } from "@/ui/shell/primitives";
import { canSeePrices } from "@/domain/policies/priceVisibility";

type Order = {
  id: string;
  orderNo: string;
  currentStatus: string;
  lockedAt: Date | null;
  preliminaryDate: string | null;
  aquaApprovedDelivery: string | null;
  confirmedDate: string | null;
  requestedDate: string | null;
  deliveryRequirement: string | null;
  notes: string | null;
  invoiceRef: string | null;
  priceSnapshotJson: string | null;
  extrasJson?: string | null;
  visualSpecJson: string | null;
  repeatHorizonMonths?: number | null;
  items: {
    qty: number;
    unitPriceExVat: number;
    visualSpecJson: string | null;
    variant: { name: string; volumeMl: number | null; optionsJson: string; product: { name: string; slug: string } };
  }[];
  documents: { id: string; title: string; kind: string }[];
  invoice: { invoiceNo: string; status: string; amountIncVat: number; dueAt: Date | null; issuedAt: Date | null } | null;
  shipments: { trackingNo: string | null; carrier: string; status: string }[];
  designs: { id: string; projectName: string; files: { id: string; fileName: string }[] }[];
  artworkApprovals?: { kind: string }[];
  customer?: { name: string };
  shippingAddress?: { line1: string; postalCode: string; city: string } | null;
};

export function BuyerOrderDetail({ order, role, repeatHref }: { order: Order; role: string; repeatHref: string }) {
  const item = order.items[0];
  const spec = specFromOrderItem({
    visualSpecJson: order.visualSpecJson,
    item,
    imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
  });
  const extrasFromOrder = parseExtras(order.extrasJson);
  const snap =
    parseSnapshot(order.priceSnapshotJson) ??
    (order.lockedAt
      ? buildPriceSnapshot({
          lines: order.items.map((i) => ({
            name: i.variant.product.name,
            qty: i.qty,
            unitPriceExVat: i.unitPriceExVat,
          })),
          extras: extrasFromOrder,
        })
      : null);
  const extras = snap?.extras ?? extrasFromOrder;
  const steps = buyerTimeline(order.currentStatus);
  const showPrice = canSeePrices(role);
  const needsProof = order.currentStatus === "ARTWORK_CUSTOMER_APPROVAL";
  const customerFinal = (order.artworkApprovals ?? []).some((a) => a.kind === "CUSTOMER_FINAL");
  const proofDoc = order.documents.find((d) => d.kind === "PROOF");
  const financeDocs = order.documents.filter((d) => d.kind === "FINANCE");
  const otherDocs = order.documents.filter((d) => d.kind !== "FINANCE");
  const approved = order.aquaApprovedDelivery ?? order.confirmedDate;
  const shipment = order.shipments[0];
  const trackSteps = shipment ? shipmentTrackingSteps(shipment.status) : [];

  return (
    <div className="space-y-6">
      <PageHeader title={order.orderNo} subtitle={item?.variant.product.name} />
      <StatusChip status={order.currentStatus} label={BUYER_STATUS[order.currentStatus]} requestedDate={order.requestedDate} />
      {order.currentStatus === "SUBMITTED" || order.currentStatus === "AQUA_REVIEW" ? (
        <NextStep
          title="Vi har tagit emot din order"
          body="Vi går nu igenom din order, leveransdatum och artwork. En slutgiltig orderbekräftelse med korrektur kommer inom 24 timmar. Detta är inte den slutliga orderbekräftelsen."
          tone="done"
        />
      ) : null}
      {approved ? (
        <Panel>
          <p className="av-label">Beräknad leverans</p>
          <p className="mt-1 text-[32px] font-semibold tabular-nums tracking-tight">{approved}</p>
          <p className="mt-1 text-sm text-[var(--av-text-muted)]">Godkänd av AquaVisibility</p>
        </Panel>
      ) : null}
      {spec && !order.lockedAt ? <VisualSpecCard spec={spec} /> : null}

      {needsProof ? (
        customerFinal ? (
          <NextStep title="Korrektur godkänd" body="AquaVisibility skickar slutlig orderbekräftelse." tone="done" />
        ) : (
          <NextStep title="Godkänn korrektur" body="När ni godkänner blir filen slutgiltig tryckfil till tryckeriet." tone="next" />
        )
      ) : null}
      {needsProof && !customerFinal ? (
        <Panel title="Korrektur">
          {proofDoc ? (
            <p className="mb-3 text-sm">
              <FileLink href={`/api/documents/${proofDoc.id}?inline=1`}>Förhandsvisa</FileLink>
              {" · "}
              <FileLink href={`/api/documents/${proofDoc.id}`}>Ladda ner</FileLink>
            </p>
          ) : null}
          <form action={customerApproveProofAction}>
            <input type="hidden" name="orderNo" value={order.orderNo} />
            <Button type="submit">Godkänn korrektur</Button>
          </form>
        </Panel>
      ) : null}

      {order.lockedAt ? (
        <>
          <OrderConfirmationPreview
            spec={spec}
            extras={extras}
            snapshot={snap}
            confirmedDate={order.confirmedDate ?? order.aquaApprovedDelivery}
            repeatHorizonMonths={order.repeatHorizonMonths}
            locked
            showPrices={showPrice}
            lockedCopy="Ordern är godkänd och låst. Kontakta AquaVisibility för ändringar."
            orderNo={order.orderNo}
            invoiceRef={order.invoiceRef}
            customer={order.customer?.name}
            address={
              order.shippingAddress
                ? `${order.shippingAddress.line1}, ${order.shippingAddress.postalCode} ${order.shippingAddress.city}`
                : undefined
            }
          />
          <a href={repeatHref} className="inline-block text-sm font-medium text-[var(--av-accent)]">
            Beställ igen
          </a>
        </>
      ) : null}

      <Panel title="Tidslinje">
        <Timeline steps={steps} />
        <dl className="mt-1 grid gap-3 border-t border-[var(--av-border)] pt-4 text-sm sm:grid-cols-2">
          <Field label="Aqua-godkänd leverans">{approved ?? "Bekräftas av AquaVisibility"}</Field>
          <Field label="Preliminärt datum">{order.preliminaryDate ?? "Beräknas från ledtid"}</Field>
        </dl>
        {order.deliveryRequirement ? (
          <p className="mt-3 text-sm font-medium text-[var(--av-status-blocked-fg)]">Viktigt leveranskrav: {order.deliveryRequirement}</p>
        ) : null}
      </Panel>

      {order.lockedAt ? null : (
        <Panel title="Tryckfil">
          {order.designs.length ? (
            <ul className="space-y-2 text-sm">
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
          ) : (
            <p className="text-sm text-[var(--av-text-muted)]">Ingen tryckfil uppladdad ännu.</p>
          )}
          <ArtworkUpload orderId={order.id} returnTo={repeatHref.replace(/\/repeat$/, "")} />
        </Panel>
      )}

      {showPrice && snap && !order.lockedAt ? (
        <Panel title="Pris">
          <ul className="space-y-1 text-sm">
            {snap.lines.map((l) => (
              <li key={l.name} className="flex justify-between gap-4">
                <span>
                  {l.name} · {l.qty.toLocaleString("sv-SE")} st
                </span>
                <span className="tabular-nums">{l.lineExVat.toLocaleString("sv-SE")} kr</span>
              </li>
            ))}
            {snap.extras.map((e) => (
              <li key={e.kind} className="flex justify-between gap-4 text-[var(--av-text-muted)]">
                <span>{e.label}</span>
                <span className="tabular-nums">{e.amountExVat.toLocaleString("sv-SE")} kr</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-lg font-semibold tabular-nums">{snap.amountExVat.toLocaleString("sv-SE")} kr ex moms</p>
        </Panel>
      ) : null}

      {order.invoice ? (
        <Panel title="Faktura">
          <p className="text-sm">
            {order.invoice.invoiceNo} · {invoiceBuyerLabel(order.invoice.status, order.invoice.dueAt)}
          </p>
          {showPrice ? (
            <p className="mt-1 text-lg font-semibold tabular-nums">{order.invoice.amountIncVat.toLocaleString("sv-SE")} kr</p>
          ) : null}
          {financeDocs.map((d) => (
            <p key={d.id} className="mt-2 text-sm">
              <FileLink href={`/api/documents/${d.id}`}>Ladda ner PDF</FileLink>
            </p>
          ))}
        </Panel>
      ) : null}

      {shipment ? (
        <Panel title="Spårning">
          <p className="text-sm">
            {shipment.carrier}
            {shipment.trackingNo ? ` · ${shipment.trackingNo}` : ""}
          </p>
          <div className="mt-4">
            <Timeline steps={trackSteps} />
          </div>
        </Panel>
      ) : null}

      {otherDocs.length ? (
        <Panel title="Dokument">
          <ul className="space-y-1 text-sm">
            {otherDocs.map((d) => (
              <li key={d.id}>
                <FileLink href={`/api/documents/${d.id}`}>{d.title}</FileLink>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
