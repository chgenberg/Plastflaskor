import Link from "next/link";
import { listWaterProducts } from "@/server/services/catalog.service";
import { quoteAction } from "@/actions";
import { PAGE_IMAGES } from "@/domain/pageImages";
import { EditorialShot, PageIntro } from "@/ui/public/PageIntro";

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ product?: string; design?: string; qty?: string; error?: string }> }) {
  const { product, design, qty, error } = await searchParams;
  const products = await listWaterProducts();
  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-16">
      <PageIntro badge="Kontakt" title="Begär offert" />
      {error ? <p className="mt-3 text-sm text-[var(--av-status-blocked-fg)]">Kontrollera e-post, företag och antal och försök igen.</p> : null}
      <p className="mt-3 text-sm text-[var(--av-text-secondary)]">
        Offert är för nya förfrågningar. Har ni redan konto?{" "}
        <Link href="/login" className="font-medium text-[var(--av-accent)]">
          Logga in till kundportalen
        </Link>
        .
      </p>
      <EditorialShot src={PAGE_IMAGES.offertProv} alt="Prov för offert" />
      <form action={quoteAction} className="av-card mt-8 space-y-4 p-7">
        <input type="hidden" name="designId" value={design ?? ""} />
        <label className="block text-sm">
          Företag
          <input required name="company" className="mt-1 h-12 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-4" />
        </label>
        <label className="block text-sm">
          E-post
          <input required type="email" name="email" className="mt-1 h-12 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-4" />
        </label>
        <label className="block text-sm">
          Telefon
          <input name="phone" className="mt-1 h-12 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-4" />
        </label>
        <label className="block text-sm">
          Produkt
          <select name="productId" defaultValue={product} className="mt-1 h-12 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-4">
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Antal
          <input name="qty" type="number" defaultValue={qty ?? 270} className="mt-1 h-12 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-4" />
        </label>
        <label className="block text-sm">
          Ort
          <input name="city" className="mt-1 h-12 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] px-4" />
        </label>
        <label className="block text-sm">
          Meddelande
          <textarea name="message" className="mt-1 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] p-4" rows={4} />
        </label>
        <button className="h-12 w-full rounded-[var(--av-radius-md)] bg-[var(--av-accent)] text-sm font-semibold text-white hover:bg-[var(--av-accent-hover)]">Skicka offertförfrågan</button>
      </form>
    </main>
  );
}
