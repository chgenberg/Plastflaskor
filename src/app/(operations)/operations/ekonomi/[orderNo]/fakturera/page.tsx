import { notFound } from "next/navigation";
import { getOrderByNo } from "@/server/services/order.service";
import { invoiceAction } from "@/actions";

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNo: string }>;
  searchParams: Promise<{ ok?: string; invoice?: string }>;
}) {
  const { orderNo } = await params;
  const { ok, invoice } = await searchParams;
  const order = await getOrderByNo(orderNo);
  if (!order) notFound();
  const amount = order.items.reduce((s, i) => s + i.unitPriceExVat * i.qty, 0);
  const vat = amount * 0.25;
  return (
    <div className="mx-auto max-w-xl rounded-2xl bg-white p-6">
      <h1 className="text-3xl font-semibold">Slutför order & fakturera</h1>
      {ok ? (
        <p className="mt-4 rounded-xl bg-[var(--av-status-done-bg)] p-3 text-sm text-[var(--av-status-done-fg)]">
          Faktura skapad. Fakturanummer: {invoice}. Status: Skickad.
        </p>
      ) : null}
      <dl className="mt-6 space-y-2 text-sm">
        <div><dt className="text-[var(--av-text-muted)]">Kund / ÅF</dt><dd>{order.reseller.company.name}</dd></div>
        <div><dt className="text-[var(--av-text-muted)]">Organisationsnummer</dt><dd>{order.reseller.company.orgNr}</dd></div>
        <div><dt className="text-[var(--av-text-muted)]">Ordernummer</dt><dd>{order.orderNo}</dd></div>
        <div><dt className="text-[var(--av-text-muted)]">Produkter</dt><dd>{order.items[0]?.qty} × {order.items[0]?.variant.product.name}</dd></div>
        <div><dt className="text-[var(--av-text-muted)]">À-pris</dt><dd>{order.items[0]?.unitPriceExVat.toFixed(2)} kr</dd></div>
        <div><dt className="text-[var(--av-text-muted)]">Frakt</dt><dd>0 kr</dd></div>
        <div><dt className="text-[var(--av-text-muted)]">Totalsumma</dt><dd>{(amount + vat).toLocaleString("sv-SE")} kr inkl. moms</dd></div>
        <div><dt className="text-[var(--av-text-muted)]">Betalningsvillkor</dt><dd>30 dagar</dd></div>
      </dl>
      <form action={invoiceAction} className="mt-6">
        <input type="hidden" name="orderNo" value={order.orderNo} />
        <button className="h-11 w-full rounded-xl bg-[var(--av-accent)] text-sm text-white">Skicka faktura via Fortnox</button>
      </form>
    </div>
  );
}
