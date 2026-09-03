import { customerApproveProofAction } from "@/actions";
import { invoiceBuyerLabel } from "@/domain/enums";
import { buyerTimeline, customerActionFor, orderBrief, shipmentTrackingSteps } from "@/domain/orderBrief";
import { hintFactsFromOrder, statusHint } from "@/domain/statusHint";
import { buildPriceSnapshot, parseExtras, parseSnapshot } from "@/domain/extras";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { OrderConfirmationPreview } from "@/ui/order/OrderConfirmationPreview";
import { ArtworkUpload } from "@/ui/shell/ArtworkUpload";
import { Button, DashPage, Field, FileLink, NextStep, PageHeader, Panel, StatusChip, StepIndicator, Timeline } from "@/ui/shell/primitives";
import { canSeePrices } from "@/domain/policies/priceVisibility";
import { orderArtworkLink } from "@/domain/orderArtwork";

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

export function BuyerOrderDetail({
  order,
  role,
  repeatHref,
  returnTo,
  embedded,
}: {
  order: Order;
  role: string;
  repeatHref: string;
  returnTo?: string;
  embedded?: boolean;
}) {
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
  const action = customerActionFor(order);
  const steps = buyerTimeline(order.currentStatus, action);
  const currentStep = steps.find((s) => s.current)?.id ?? "received";
  const showPrice = canSeePrices(role);
  const hint = statusHint(order.currentStatus, hintFactsFromOrder(order), "CUSTOMER");
  const brief = orderBrief(order.currentStatus, order.requestedDate);
  const proofDoc = order.documents.find((d) => d.kind === "PROOF");
  const artwork = orderArtworkLink(order);
  const financeDocs = order.documents.filter((d) => d.kind === "FINANCE");
  const otherDocs = order.documents.filter((d) => d.kind !== "FINANCE");
  const approved = order.aquaApprovedDelivery ?? order.confirmedDate;
  const shipment = order.shipments[0];
  const trackSteps = shipment ? shipmentTrackingSteps(shipment.status) : [];
  const artworkReturnTo = returnTo ?? repeatHref.replace(/\/repeat$/, "");
  const latestFile = order.designs.flatMap((d) => d.files)[0];
  const body = (
    <>
      {embedded ? null : <PageHeader title={order.orderNo} subtitle={item?.variant.product.name} />}
      {embedded && item ? <p className="text-[13px] text-[var(--av-text-muted)]">{item.variant.product.name}</p> : null}
      <p className="text-[12px] text-[var(--av-text-muted)]">Agenten bevakar kedjan. Ni behöver inte mejla oss för status.</p>
      <StatusChip status={order.currentStatus} hint={hint} requestedDate={order.requestedDate} />
      <Panel title="Tidslinje">
        <p className="mb-3 text-sm text-[var(--av-text-muted)] md:hidden">
          Steg {steps.findIndex((s) => s.current) + 1} av {steps.length}
        </p>
        <div className="hidden md:block">
          <StepIndicator steps={steps.map((s) => ({ id: s.id, label: s.label }))} current={currentStep} />
        </div>
        <div className="md:hidden">
          <Timeline steps={steps} />
        </div>
        <dl className="mt-4 grid gap-3 border-t border-[var(--av-border)] pt-4 text-sm sm:grid-cols-2">
          <Field label="Aqua-godkänd leverans">{approved ?? "Bekräftas av AquaVisibility"}</Field>
          <Field label="Preliminärt datum">{order.preliminaryDate ?? "Beräknas från ledtid"}</Field>
        </dl>
        {order.deliveryRequirement ? (
          <p className="mt-3 text-sm font-medium text-[var(--av-status-blocked-fg)]">Viktigt leveranskrav: {order.deliveryRequirement}</p>
        ) : null}
      </Panel>
      {action === "artwork" ? (
        <NextStep title="Ladda upp artwork" body="Utan artwork kan vi inte skicka korrektur." tone="next" />
      ) : null}
      {action === "proof" ? (
        <NextStep title="Godkänn korrektur" body="Filen blir slutgiltig artwork till etikettproducenten." tone="next" />
      ) : null}
      {action === null && !order.lockedAt ? (
        <NextStep title="Vi jobbar på din order" body={brief.waiting} tone="done" />
      ) : null}
      {approved ? (
        <Panel>
          <p className="av-label">Beräknad leverans</p>
          <p className="mt-1 text-[32px] font-semibold tabular-nums tracking-tight">{approved}</p>
          <p className="mt-1 text-sm text-[var(--av-text-muted)]">Godkänd av AquaVisibility</p>
        </Panel>
      ) : null}
      {spec && !order.lockedAt ? <VisualSpecCard spec={spec} /> : null}
      {showPrice && item && !order.lockedAt ? (
        <Panel title="Rader">
          <ul className="space-y-1 text-sm">
            {order.items.map((line) => (
              <li key={line.variant.product.slug} className="flex justify-between gap-4">
                <span>
                  {line.variant.product.name} · {line.qty.toLocaleString("sv-SE")} st
                </span>
                <span className="tabular-nums">{line.unitPriceExVat.toLocaleString("sv-SE")} kr</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {!order.lockedAt ? (
        <Panel title="Artwork och korrektur">
          <div id="steg-artwork" className="space-y-3">
            {latestFile ? (
              latestFile.fileName.match(/\.(png|jpe?g|webp|gif|svg)$/i) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/artwork-files/${latestFile.id}`} alt="" className="max-h-48 rounded-[var(--av-radius-md)] border border-[var(--av-border)]" />
              ) : (
                <FileLink href={`/api/artwork-files/${latestFile.id}`}>{latestFile.fileName}</FileLink>
              )
            ) : (
              <p className="text-sm text-[var(--av-text-muted)]">Ingen artwork uppladdad ännu.</p>
            )}
            {action === "artwork" ? <ArtworkUpload orderId={order.id} returnTo={artworkReturnTo} /> : null}
          </div>
          <div id="steg-korr" className="mt-4 space-y-3">
            {proofDoc ? (
              <p className="text-sm">
                <FileLink href={`/api/documents/${proofDoc.id}?inline=1`}>Förhandsvisa korrektur</FileLink>
                {" · "}
                <FileLink href={`/api/documents/${proofDoc.id}`}>Ladda ner</FileLink>
              </p>
            ) : null}
            {action === "proof" ? (
              <form action={customerApproveProofAction}>
                <input type="hidden" name="orderNo" value={order.orderNo} />
                <Button type="submit">Godkänn korrektur</Button>
              </form>
            ) : null}
          </div>
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
            showRepeat={false}
            lockedCopy="Ordern är godkänd och låst. Kontakta AquaVisibility för ändringar."
            orderNo={order.orderNo}
            invoiceRef={order.invoiceRef}
            customer={order.customer?.name}
            address={
              order.shippingAddress
                ? `${order.shippingAddress.line1}, ${order.shippingAddress.postalCode} ${order.shippingAddress.city}`
                : undefined
            }
            artworkHref={artwork?.href}
            artworkLabel={artwork?.label}
          />
          <a href={repeatHref} className="inline-block text-sm font-medium text-[var(--av-accent)]">
            Beställ igen
          </a>
        </>
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
    </>
  );
  return embedded ? <div className="av-peek-detail">{body}</div> : <DashPage>{body}</DashPage>;
}
