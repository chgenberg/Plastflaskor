import Image from "next/image";
import Link from "next/link";
import { imageForProduct } from "@/domain/productImages";
import { listProducts } from "@/server/services/catalog.service";
import { PageIntro } from "@/ui/public/PageIntro";

export default async function OvrigaPage() {
  const products = await listProducts("kyl");
  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-16">
      <PageIntro badge="Övriga" title="Kyl och tillbehör" align="center" />
      <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--av-text-secondary)]">
        En profilerbar kyl med avtagbart energibesparande lock.
      </p>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {products.map((p) => {
          const img = imageForProduct(p.slug);
          return (
            <article key={p.id} className="av-card overflow-hidden">
              {img ? (
                <Link href={`/produkter/${p.categorySlug}/${p.slug}`} className="relative block aspect-[4/5]">
                  <Image src={img} alt={p.name} fill className="object-cover" sizes="50vw" />
                </Link>
              ) : null}
              <div className="p-7">
                <h2 className="av-serif text-2xl tracking-[-0.01em]">{p.name}</h2>
                <p className="mt-2 text-sm text-[var(--av-text-secondary)]">{p.oneLiner}</p>
                <div className="mt-6 flex gap-4 text-sm font-medium">
                  <Link href={`/produkter/${p.categorySlug}/${p.slug}`} className="text-[var(--av-accent)]">
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
