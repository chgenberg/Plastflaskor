import Image from "next/image";
import Link from "next/link";
import { imageForProduct } from "@/domain/productImages";
import { listProducts } from "@/server/services/catalog.service";
import { Reveal } from "@/ui/motion/Reveal";
import { PageIntro, PublicPage } from "@/ui/public/PageIntro";

export default async function OvrigaPage() {
  const products = await listProducts("kyl");
  return (
    <PublicPage>
      <Reveal variant="public">
        <PageIntro badge="Övriga" title="Kyl och tillbehör" align="center" />
        <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--av-text-secondary)]">
          En profilerbar kyl med avtagbart energibesparande lock.
        </p>
      </Reveal>
      <Reveal variant="public">
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {products.map((p) => {
            const img = imageForProduct(p.slug);
            return (
              <article key={p.id} className="av-card av-card-lift overflow-hidden">
                {img ? (
                  <Link href={`/produkter/${p.categorySlug}/${p.slug}`} className="av-media block aspect-[4/5] rounded-none">
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
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Reveal>
    </PublicPage>
  );
}
