import Image from "next/image";
import Link from "next/link";
import { CATEGORY_META } from "@/domain/enums";
import { PAGE_IMAGES } from "@/domain/pageImages";
import { imageForProduct } from "@/domain/productImages";
import { listCategories, listProducts } from "@/server/services/catalog.service";
import { EditorialShot, PageIntro } from "@/ui/public/PageIntro";

const INTRO: Record<string, string> = {
  profilvatten: "Vårt populära profilvatten med egen etikett tappas ur Tollagårdens friska källa!",
  pappersmuggar:
    "Vi levererar pappersmuggar med enkel- och dubbelvägg i olika storlekar. Alla pappersmuggar tillverkas av FSC-märkt kartong.",
  energidryck: "Visst är det häftigt att kunna servera sin ”egna energidryck”!",
  sportflaskor: "Sportflaskor med oändliga möjligheter.",
  "lask-must": "Läsk och julmust från anrika Mora Bryggeri.",
  kyl: "En profilerbar kyl med avtagbart energibesparande lock.",
};

export default async function ProductsIndex() {
  const slugs = [...new Set([...Object.keys(CATEGORY_META), ...(await listCategories())])];
  const products = await listProducts();
  const cover: Record<string, string> = { profilvatten: PAGE_IMAGES.valAntal };
  for (const p of products) {
    const img = imageForProduct(p.slug);
    if (img && !cover[p.categorySlug]) cover[p.categorySlug] = img;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-36">
      <PageIntro badge="Sortiment" title="Produkter" align="center" />
      <EditorialShot src={PAGE_IMAGES.produkterHero} alt="Vårt sortiment" className="mx-auto mt-10 max-w-4xl aspect-[16/9]" />
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {slugs.map((slug) => {
          const c = CATEGORY_META[slug];
          if (!c) return null;
          return (
            <Link key={c.slug} href={`/produkter/${c.slug}`} className="group overflow-hidden rounded-[28px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              {cover[c.slug] ? (
                <div className="relative aspect-[16/10]">
                  <Image src={cover[c.slug]} alt={c.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="50vw" />
                </div>
              ) : null}
              <div className="p-8">
                <h2 className="av-serif text-2xl tracking-[-0.01em]">{c.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--av-text-secondary)]">{INTRO[c.slug]}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
