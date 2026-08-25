import Link from "next/link";
import { listProducts } from "@/server/services/catalog.service";
import { quoteAction } from "@/actions";
import { PAGE_IMAGES } from "@/domain/pageImages";
import { EditorialShot, PageIntro } from "@/ui/public/PageIntro";

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ product?: string; design?: string; qty?: string; error?: string }> }) {
  const { product, design, qty, error } = await searchParams;
  const products = await listProducts();
  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-36">
      <PageIntro badge="Kontakt" title="Begär offert" />
      {error ? <p className="mt-3 text-sm text-[var(--av-status-blocked-fg)]">Kontrollera e-post, företag och antal och försök igen.</p> : null}
      <p className="mt-3 text-sm text-[var(--av-text-secondary)]">
        Vill du testa hela köpet med dummyfaktura och Stripe-testkort?{" "}
        <Link
          href={`/kassa${product ? `?product=${product}` : ""}${design ? `${product ? "&" : "?"}design=${design}` : ""}`}
          className="font-medium text-[#1d1d1f]"
        >
          Gå till kassan
        </Link>
        .
      </p>
      <EditorialShot src={PAGE_IMAGES.offertProv} alt="Prov för offert" />
      <form action={quoteAction} className="mt-8 space-y-4 rounded-[28px] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <input type="hidden" name="designId" value={design ?? ""} />
        <label className="block text-sm">
          Företag
          <input required name="company" className="mt-1 h-12 w-full rounded-full border border-[var(--av-border)] px-4" />
        </label>
        <label className="block text-sm">
          E-post
          <input required type="email" name="email" className="mt-1 h-12 w-full rounded-full border border-[var(--av-border)] px-4" />
        </label>
        <label className="block text-sm">
          Telefon
          <input name="phone" className="mt-1 h-12 w-full rounded-full border border-[var(--av-border)] px-4" />
        </label>
        <label className="block text-sm">
          Produkt
          <select name="productId" defaultValue={product} className="mt-1 h-12 w-full rounded-full border border-[var(--av-border)] px-4">
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Antal
          <input name="qty" type="number" defaultValue={qty ?? 270} className="mt-1 h-12 w-full rounded-full border border-[var(--av-border)] px-4" />
        </label>
        <label className="block text-sm">
          Ort
          <input name="city" className="mt-1 h-12 w-full rounded-full border border-[var(--av-border)] px-4" />
        </label>
        <label className="block text-sm">
          Meddelande
          <textarea name="message" className="mt-1 w-full rounded-3xl border border-[var(--av-border)] p-4" rows={4} />
        </label>
        <button className="h-[52px] w-full rounded-full bg-[#1d1d1f] text-sm font-semibold text-white">Skicka offertförfrågan</button>
      </form>
    </main>
  );
}
