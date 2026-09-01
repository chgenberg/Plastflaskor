import { notFound } from "next/navigation";
import { isAquaAdmin } from "@/domain/policies/roles";
import { getSessionUser } from "@/server/rbac";
import { getOrderByNo } from "@/server/services/order.service";
import { getFortnoxConnection } from "@/server/integrations/status";
import { markInvoicePaid } from "@/actions";
import { buildPriceSnapshot, parseExtras, parseSnapshot } from "@/domain/extras";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";
import { OrderConfirmationPreview } from "@/ui/order/OrderConfirmationPreview";
import { Button, DashPage, FileLink, PageHeader, Panel } from "@/ui/shell/primitives";
import { FortnoxBadge } from "@/ui/shell/FortnoxBadge";
import { FortnoxInvoiceForm } from "@/ui/ops/FortnoxInvoiceForm";
import { orderArtworkLink } from "@/domain/orderArtwork";

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNo: string }>;
  searchParams: Promise<{ ok?: string; invoice?: string }>;
}) {
  const { orderNo } = await params;
  const { ok, invoice } = await searchParams;
  const user = await getSessionUser();
  const fortnox = getFortnoxConnection();
  const order = await getOrderByNo(orderNo);
  if (!order) notFound();
  const extras = parseExtras(order.extrasJson);
  const snapshot =
    parseSnapshot(order.priceSnapshotJson) ??
    buildPriceSnapshot({
      lines: order.items.map((i) => ({
        name: i.variant.product.name,
        qty: i.qty,
        unitPriceExVat: i.unitPriceExVat,
      })),
      extras,
    });
  const item = order.items[0];
  const spec = specFromOrderItem({
    visualSpecJson: order.visualSpecJson,
    item,
    imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
  });
  const amount = snapshot.amountExVat;
  const vat = snapshot.vatAmount;
  const invoiceDoc = order.documents.find((d) => d.kind === "FINANCE");
  const issued = order.invoice?.status === "ISSUED";
  const artwork = orderArtworkLink(order);
  const billing =
    order.customer.addresses.find((a) => a.type === "BILLING") ??
    order.customer.addresses[0] ??
    order.shippingAddress;
  const freight = order.shipments.find((s) => s.type === "GOODS_TO_CUSTOMER") ?? order.shipments[0];
  return (
    <div className="mx-auto max-w-xl">
    <DashPage>
      <PageHeader
        title="Slutför order & fakturera"
        subtitle={order.orderNo}
        action={
          <FortnoxBadge
            label={fortnox.label}
            invoiceNo={order.invoice?.invoiceNo ?? invoice}
            fortnoxId={order.invoice?.fortnoxId}
          />
        }
      />
      <OrderConfirmationPreview
        spec={spec}
        extras={snapshot.extras}
        snapshot={snapshot}
        confirmedDate={order.confirmedDate ?? order.aquaApprovedDelivery}
        repeatHorizonMonths={order.repeatHorizonMonths}
        locked={Boolean(order.lockedAt)}
        lockedCopy="Ordern är godkänd och låst. Kontakta AquaVisibility för ändringar."
        orderNo={order.orderNo}
        customer={order.customer.name}
        address={`${order.shippingAddress.line1}, ${order.shippingAddress.postalCode} ${order.shippingAddress.city}`}
        invoiceRef={order.invoiceRef}
        artworkHref={artwork?.href}
        artworkLabel={artwork?.label}
      />
      <Panel>
        {ok ? (
          <p className="mb-5 rounded-2xl bg-[var(--av-status-done-bg)] p-3 text-sm text-[var(--av-status-done-fg)]">
            Faktura skapad. Fakturanummer: {invoice}. Status: Skickad.
          </p>
        ) : null}
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="av-label">Kund</dt>
            <dd className="mt-1">{order.customer.name}</dd>
          </div>
          <div>
            <dt className="av-label">Organisationsnummer</dt>
            <dd className="mt-1">{order.customer.orgNr ?? order.customer.company?.orgNr ?? "–"}</dd>
          </div>
          <div>
            <dt className="av-label">Fakturaadress</dt>
            <dd className="mt-1">
              {billing.line1}, {billing.postalCode} {billing.city}
            </dd>
          </div>
          <div>
            <dt className="av-label">E-post</dt>
            <dd className="mt-1">{order.customer.email ?? order.customer.company?.email ?? "–"}</dd>
          </div>
          <div>
            <dt className="av-label">Fakturareferens</dt>
            <dd className="mt-1">{order.invoiceRef ?? "–"}</dd>
          </div>
          <div>
            <dt className="av-label">Ordernummer</dt>
            <dd className="mt-1 font-mono">{order.orderNo}</dd>
          </div>
          <div>
            <dt className="av-label">Produkter</dt>
            <dd className="mt-1">
              {order.items[0]?.qty} × {order.items[0]?.variant.product.name}
            </dd>
          </div>
          <div>
            <dt className="av-label">À-pris</dt>
            <dd className="mt-1 tabular-nums">{order.items[0]?.unitPriceExVat.toFixed(2)} kr</dd>
          </div>
          <div>
            <dt className="av-label">Frakt</dt>
            <dd className="mt-1">
              {freight ? `${freight.carrier} · ${freight.packages} kolli · ${freight.weightKg} kg` : "Enligt avtal / 0 kr i demo"}
            </dd>
          </div>
          <div>
            <dt className="av-label">Betalningsvillkor</dt>
            <dd className="mt-1">30 dagar</dd>
          </div>
          {order.invoice?.invoiceNo ? (
            <div>
              <dt className="av-label">Fortnox</dt>
              <dd className="mt-1 font-mono">
                {order.invoice.invoiceNo}
                {order.invoice.fortnoxId ? ` · ${order.invoice.fortnoxId}` : ""}
              </dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-6 space-y-2 border-t border-[var(--av-border)] pt-4 text-sm">
          {snapshot.extras.map((e) => (
            <p key={e.kind} className="flex justify-between gap-4 text-[var(--av-text-muted)]">
              <span>{e.label}</span>
              <span className="tabular-nums">{e.amountExVat.toLocaleString("sv-SE")} kr</span>
            </p>
          ))}
          <p className="flex justify-between gap-4 text-[var(--av-text-muted)]">
            <span>Varor</span>
            <span className="tabular-nums">{snapshot.goodsExVat.toLocaleString("sv-SE")} kr</span>
          </p>
          <p className="flex justify-between gap-4 text-[var(--av-text-muted)]">
            <span>Tillägg</span>
            <span className="tabular-nums">{snapshot.extrasExVat.toLocaleString("sv-SE")} kr</span>
          </p>
          <p className="flex justify-between gap-4 font-medium">
            <span>Totalt ex moms</span>
            <span className="tabular-nums">{amount.toLocaleString("sv-SE")} kr</span>
          </p>
          <p className="flex justify-between gap-4 text-[var(--av-text-muted)]">
            <span>Moms</span>
            <span className="tabular-nums">{vat.toLocaleString("sv-SE")} kr</span>
          </p>
          <p className="flex justify-between gap-4 text-lg font-semibold">
            <span>Totalsumma inkl. moms</span>
            <span className="tabular-nums">{(amount + vat).toLocaleString("sv-SE")} kr</span>
          </p>
        </div>
        {invoiceDoc ? (
          <p className="mt-4 text-sm">
            <FileLink href={`/api/documents/${invoiceDoc.id}`}>{invoiceDoc.title}</FileLink>
          </p>
        ) : null}
        <FortnoxInvoiceForm orderNo={order.orderNo} created={issued || Boolean(ok)} />
        {issued && isAquaAdmin(user?.role) && order.invoice ? (
          <form action={markInvoicePaid} className="mt-6">
            <input type="hidden" name="invoiceNo" value={order.invoice.invoiceNo} />
            <Button type="submit" className="w-full">
              Markera betald
            </Button>
          </form>
        ) : issued ? (
          <p className="mt-6 text-sm text-[var(--av-text-muted)]">Faktura utfärdad. Väntar på betalning.</p>
        ) : null}
      </Panel>
    </DashPage>
    </div>
  );
}
