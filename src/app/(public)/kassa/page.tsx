import { listCupProducts } from "@/server/services/catalog.service";
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
  const products = (await listCupProducts()).filter((p) => p.isPublic);
  const selected = products.find((p) => p.id === product) ?? products[0];
  if (!selected) {
    return (
      <main className="mx-auto max-w-xl px-4 pb-20 pt-16">
        <PageIntro title="Kassan är tom" />
        <p className="mt-4 text-[var(--av-text-secondary)]">Välj en produkt först.</p>
      </main>
    );
  }

  const preview = await previewCheckout(selected.id, Number(qty ?? selected.moq), user?.resellerId, user?.customerId);
  const loggedIn = user?.role === "RESELLER" || user?.role === "CUSTOMER";

  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-16">
      <PageIntro badge="Kassa" title="Slutför beställning" />
      <p className="mt-3 text-sm leading-relaxed text-[var(--av-text-secondary)]">
        Priser visas efter inloggning. Logga in som kund eller ÅF för att slutföra.
      </p>

      <aside className="av-card mt-8 p-6">
        <p className="av-label">Sammanfattning</p>
        <p className="mt-2 font-medium text-[var(--av-text)]">{preview.product.name}</p>
        <dl className="mt-4 space-y-1.5 text-sm text-[var(--av-text-muted)]">
          <div className="flex justify-between">
            <dt>Lista</dt>
            <dd>{preview.listName}</dd>
          </div>
          {preview.pricesHidden || preview.unitPriceExVat == null ? (
            <p className="pt-2 text-sm">Logga in för pris</p>
          ) : (
            <>
              <div className="flex justify-between">
                <dt>{preview.qty} st à</dt>
                <dd>{preview.unitPriceExVat.toFixed(2)} kr</dd>
              </div>
              <div className="flex justify-between">
                <dt>Ex moms</dt>
                <dd>{preview.amountExVat?.toFixed(2)} kr</dd>
              </div>
              <div className="flex justify-between font-semibold text-[var(--av-text)]">
                <dt>Att betala</dt>
                <dd>{preview.amountIncVat?.toFixed(2)} kr</dd>
              </div>
            </>
          )}
        </dl>
      </aside>

      <div className="av-card mt-6 p-7">
        <CheckoutForm
          loggedIn={loggedIn}
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
            pricesHidden: preview.pricesHidden,
            designId: design,
          }}
        />
      </div>
    </main>
  );
}
