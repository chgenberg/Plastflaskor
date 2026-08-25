import { listProducts } from "@/server/services/catalog.service";
import { previewCheckout } from "@/server/services/checkout.service";
import { getSessionUser } from "@/server/rbac";
import { PageIntro } from "@/ui/public/PageIntro";
import { CheckoutForm } from "./CheckoutForm";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; design?: string; qty?: string }>;
}) {
  const { product, design, qty } = await searchParams;
  const user = await getSessionUser();
  const products = await listProducts();
  const selected = products.find((p) => p.id === product) ?? products[0];
  if (!selected) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-36">
        <PageIntro title="Kassan är tom" />
        <p className="mt-4 text-[var(--av-text-secondary)]">Välj en produkt först.</p>
      </main>
    );
  }

  const preview = await previewCheckout(selected.id, Number(qty ?? selected.moq), user?.resellerId);

  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-36">
      <PageIntro badge="Kassa" title="Slutför beställning" />
      <p className="mt-3 text-sm leading-relaxed text-[var(--av-text-secondary)]">
        Stripe-testläge. Dummyfaktura och testkort — ingen affär sker och inget kort debiteras.
      </p>

      <aside className="mt-8 rounded-[28px] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#766a62]">Sammanfattning</p>
        <p className="mt-2 font-medium text-[#1d1d1f]">{preview.product.name}</p>
        <dl className="mt-4 space-y-1.5 text-sm text-[#6b7280]">
          <div className="flex justify-between">
            <dt>Lista</dt>
            <dd>{preview.listName}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{preview.qty} st à</dt>
            <dd>{preview.unitPriceExVat.toFixed(2)} kr</dd>
          </div>
          <div className="flex justify-between">
            <dt>Ex moms</dt>
            <dd>{preview.amountExVat.toFixed(2)} kr</dd>
          </div>
          <div className="flex justify-between">
            <dt>Moms 25%</dt>
            <dd>{preview.vatAmount.toFixed(2)} kr</dd>
          </div>
          <div className="flex justify-between font-semibold text-[#1d1d1f]">
            <dt>Att betala</dt>
            <dd>{preview.amountIncVat.toFixed(2)} kr</dd>
          </div>
        </dl>
      </aside>

      <div className="mt-6 rounded-[28px] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <CheckoutForm
          loggedIn={user?.role === "RESELLER"}
          defaults={{ company: user?.name ?? "", email: user?.email ?? "" }}
          preview={{
            productId: preview.product.id,
            productName: preview.product.name,
            qty: preview.qty,
            moq: preview.product.moq,
            unitPriceExVat: preview.unitPriceExVat,
            amountExVat: preview.amountExVat,
            vatAmount: preview.vatAmount,
            amountIncVat: preview.amountIncVat,
            listName: preview.listName,
            designId: design,
          }}
        />
      </div>
    </main>
  );
}
