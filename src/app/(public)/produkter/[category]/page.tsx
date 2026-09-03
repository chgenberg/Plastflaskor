import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_META } from "@/domain/enums";
import { PAGE_IMAGES } from "@/domain/pageImages";
import { imageForProduct } from "@/domain/productImages";
import { listProducts } from "@/server/services/catalog.service";
import { Reveal } from "@/ui/motion/Reveal";
import { PageIntro, PillLink, PublicPage } from "@/ui/public/PageIntro";

const INTRO: Record<string, string> = {
  profilvatten: "Vårt populära profilvatten med egen etikett tappas ur Tollagårdens friska källa!",
  pappersmuggar:
    "Vi levererar pappersmuggar med enkel- och dubbelvägg i olika storlekar. Alla pappersmuggar tillverkas av FSC-märkt kartong.",
  energidryck: "Visst är det häftigt att kunna servera sin ”egna energidryck”!",
  sportflaskor: "Sportflaskor med oändliga möjligheter.",
  "lask-must": "Läsk och julmust från anrika Mora Bryggeri.",
  kyl: "En profilerbar kyl med avtagbart energibesparande lock.",
};

const COVER: Record<string, string> = {
  profilvatten: PAGE_IMAGES.valAntal,
};

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const meta = CATEGORY_META[category];
  if (!meta) notFound();
  const products = await listProducts(category);

  return (
    <PublicPage>
      <Reveal variant="public">
        <PageIntro badge="Produkter" title={meta.name} align="center" />
        {INTRO[category] ? (
          <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--av-text-secondary)]">{INTRO[category]}</p>
        ) : null}
      </Reveal>
      {products.length === 0 ? (
        <Reveal variant="public">
          <div className="mt-12 space-y-8 text-center">
            {COVER[category] ? (
              <div className="av-media mx-auto aspect-[16/10] max-w-3xl">
                <Image src={COVER[category]} alt={meta.name} fill className="object-cover" sizes="800px" />
              </div>
            ) : null}
            <p className="text-sm text-[var(--av-text-secondary)]">Inget i den här kategorin just nu. Begär offert så återkommer Aqua.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <PillLink href="/login">Logga in till kundportalen</PillLink>
              <PillLink href="/offert" variant="ghost">
                Begär offert
              </PillLink>
            </div>
          </div>
        </Reveal>
      ) : (
        <Reveal variant="public">
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {products.map((p) => {
              const img = imageForProduct(p.slug);
              return (
                <Link key={p.id} href={`/produkter/${category}/${p.slug}`} className="av-card av-card-lift overflow-hidden">
                  {img ? (
                    <div className="av-media aspect-[4/5] rounded-none">
                      <Image src={img} alt={p.name} fill className="object-cover" sizes="50vw" />
                    </div>
                  ) : null}
                  <div className="p-7">
                    <h2 className="av-serif text-2xl tracking-[-0.01em]">{p.name}</h2>
                    <p className="mt-2 text-sm text-[var(--av-text-secondary)]">{p.oneLiner}</p>
                    <p className="mt-6 text-sm font-medium text-[var(--av-accent)]">Konfigurera →</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>
      )}
    </PublicPage>
  );
}
