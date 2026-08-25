import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_META } from "@/domain/enums";
import { imageForProduct } from "@/domain/productImages";
import { listProducts } from "@/server/services/catalog.service";
import { PageIntro } from "@/ui/public/PageIntro";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const meta = CATEGORY_META[category];
  if (!meta) notFound();
  const products = await listProducts(category);
  if (!products.length) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-36">
      <PageIntro badge="Produkter" title={meta.name} align="center" />
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {products.map((p) => {
          const img = imageForProduct(p.slug);
          return (
            <article key={p.id} className="overflow-hidden rounded-[28px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              {img ? (
                <Link href={`/produkter/${category}/${p.slug}`} className="relative block aspect-[4/5]">
                  <Image src={img} alt={p.name} fill className="object-cover" sizes="50vw" />
                </Link>
              ) : null}
              <div className="p-7">
                <h2 className="av-serif text-2xl tracking-[-0.01em]">{p.name}</h2>
                <p className="mt-2 text-sm text-[var(--av-text-secondary)]">{p.oneLiner}</p>
                <div className="mt-6 flex gap-4 text-sm font-medium">
                  <Link href={`/produkter/${category}/${p.slug}`} className="text-[#1d1d1f]">
                    Läs mer →
                  </Link>
                  {p.studioEnabled ? <Link href={`/designa/${p.slug}`}>Designa</Link> : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
