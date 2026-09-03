import Link from "next/link";
import { listWaterProducts } from "@/server/services/catalog.service";
import { quoteAction } from "@/actions";
import { PAGE_IMAGES } from "@/domain/pageImages";
import { Reveal } from "@/ui/motion/Reveal";
import { EditorialShot, PageIntro, PublicPage } from "@/ui/public/PageIntro";
import { Button, controlClass } from "@/ui/shell/primitives";

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ product?: string; design?: string; qty?: string; error?: string }> }) {
  const { product, design, qty, error } = await searchParams;
  const products = await listWaterProducts();
  return (
    <PublicPage narrow>
      <Reveal variant="public">
      <PageIntro badge="Kontakt" title="Begär offert" />
      {error ? <p className="mt-3 text-sm text-[var(--av-status-blocked-fg)]">Kontrollera e-post, företag och antal och försök igen.</p> : null}
      <p className="mt-3 text-sm text-[var(--av-text-secondary)]">
        Offert är för stora volymer, specialformat eller frågor. Standardsortimentet
        beställer du direkt på{" "}
        <Link href="/produkter/profilvatten" className="font-medium text-[var(--av-accent)]">
          produktsidan
        </Link>
        .
      </p>
      <EditorialShot src={PAGE_IMAGES.offertProv} alt="Prov för offert" />
      </Reveal>
      <form action={quoteAction} className="av-card mt-8 space-y-4 p-7">
        <input type="hidden" name="designId" value={design ?? ""} />
        <label className="block text-sm">
          Företag
          <input required name="company" className={`${controlClass} mt-1`} />
        </label>
        <label className="block text-sm">
          E-post
          <input required type="email" name="email" className={`${controlClass} mt-1`} />
        </label>
        <label className="block text-sm">
          Telefon
          <input name="phone" className={`${controlClass} mt-1`} />
        </label>
        <label className="block text-sm">
          Produkt
          <select name="productId" defaultValue={product} className={`${controlClass} mt-1`}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Antal
          <input name="qty" type="number" defaultValue={qty ?? 270} className={`${controlClass} mt-1`} />
        </label>
        <label className="block text-sm">
          Ort
          <input name="city" className={`${controlClass} mt-1`} />
        </label>
        <label className="block text-sm">
          Meddelande
          <textarea name="message" className={`${controlClass} mt-1 h-auto py-3`} rows={4} />
        </label>
        <Button type="submit" size="lg" className="w-full">
          Skicka offertförfrågan
        </Button>
      </form>
    </PublicPage>
  );
}
