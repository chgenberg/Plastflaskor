import { notFound } from "next/navigation";
import { getSessionUser } from "@/server/rbac";
import { getOrderByNo } from "@/server/services/order.service";
import { invoiceAction, markInvoicePaid } from "@/actions";
import { Button, FileLink, PageHeader, Panel } from "@/ui/shell/primitives";

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
  const order = await getOrderByNo(orderNo);
  if (!order) notFound();
  const amount = order.items.reduce((s, i) => s + i.unitPriceExVat * i.qty, 0);
  const vat = amount * 0.25;
  const invoiceDoc = order.documents.find((d) => d.kind === "FINANCE");
  const issued = order.invoice?.status === "ISSUED";
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader title="Slutför order & fakturera" subtitle={order.orderNo} />
      <Panel>
        {ok ? (
          <p className="mb-5 rounded-2xl bg-[var(--av-status-done-bg)] p-3 text-sm text-[var(--av-status-done-fg)]">
            Faktura skapad. Fakturanummer: {invoice}. Status: Skickad.
          </p>
        ) : null}
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Kund / ÅF</dt>
            <dd className="mt-1">{order.reseller.company.name}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Organisationsnummer</dt>
            <dd className="mt-1">{order.reseller.company.orgNr}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Produkter</dt>
            <dd className="mt-1">
              {order.items[0]?.qty} × {order.items[0]?.variant.product.name}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">À-pris</dt>
            <dd className="mt-1 tabular-nums">{order.items[0]?.unitPriceExVat.toFixed(2)} kr</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Totalsumma</dt>
            <dd className="mt-1 tabular-nums">{(amount + vat).toLocaleString("sv-SE")} kr inkl. moms</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Betalningsvillkor</dt>
            <dd className="mt-1">30 dagar</dd>
          </div>
        </dl>
        {invoiceDoc ? (
          <p className="mt-4 text-sm">
            <FileLink href={`/api/documents/${invoiceDoc.id}`}>{invoiceDoc.title}</FileLink>
          </p>
        ) : null}
        {!issued ? (
          <form action={invoiceAction} className="mt-6">
            <input type="hidden" name="orderNo" value={order.orderNo} />
            <Button type="submit" className="w-full">
              Skicka faktura via Fortnox
            </Button>
          </form>
        ) : user?.role === "AQUA_ADMIN" && order.invoice ? (
          <form action={markInvoicePaid} className="mt-6">
            <input type="hidden" name="invoiceNo" value={order.invoice.invoiceNo} />
            <Button type="submit" className="w-full">
              Markera betald
            </Button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-[#6b7280]">Faktura utfärdad. Väntar på betalning.</p>
        )}
      </Panel>
    </div>
  );
}
