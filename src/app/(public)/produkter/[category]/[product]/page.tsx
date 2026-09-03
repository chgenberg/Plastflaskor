import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, publicProductDto } from "@/server/services/catalog.service";
import { getSessionUser } from "@/server/rbac";
import { canSeePrices } from "@/domain/policies/priceVisibility";
import { CATEGORY_META } from "@/domain/enums";
import { imageForProduct } from "@/domain/productImages";
import { productFacts, volumeLabel } from "@/domain/productFacts";
import { unique } from "@/domain/bottleVariants";
import { Reveal } from "@/ui/motion/Reveal";
import { Badge, PageIntro, PillLink, PublicPage } from "@/ui/public/PageIntro";
import { ProductCheckout } from "@/ui/product/ProductCheckout";

export default async function ProductPage({ params }: { params: Promise<{ category: string; product: string }> }) {
  const { category, product } = await params;
  const raw = await getProductBySlug(product);
  if (!raw || !raw.isPublic || raw.categorySlug !== category) notFound();
  const item = publicProductDto(raw);
  const user = await getSessionUser();
  const img = imageForProduct(item.slug);
  const categoryName = CATEGORY_META[category]?.name ?? category;
  const volumes = unique(item.variants.map((v) => volumeLabel(v.volumeMl)).filter((v): v is string => Boolean(v)));
  const facts = productFacts({
    moq: raw.moq,
    leadTimeText: raw.leadTimeText,
    country: raw.country,
    environmentText: raw.environmentText,
    specText: raw.specText,
  }).filter((row) => row.label !== "Flaskstorlek");
  if (volumes.length) facts.unshift({ label: "Flaskstorlek", value: volumes.join(", ") });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description: item.oneLiner,
    category,
    brand: { "@type": "Brand", name: "aqua visibility" },
  };

  const isWater = raw.category === "WATER";
  const seePrices = canSeePrices(user?.role);

  return (
    <PublicPage className="pb-24 lg:pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Reveal variant="public">
        <Link href={`/produkter/${category}`} className="text-sm text-[var(--av-text-secondary)]">
          ← {categoryName}
        </Link>
        {img ? (
          <div className="av-media relative mt-6 aspect-[16/9] sm:aspect-[21/9]">
            <Image src={img} alt={item.name} fill className="object-cover" sizes="1100px" priority />
            <div className="absolute left-4 top-4">
              <Badge>{categoryName}</Badge>
            </div>
          </div>
        ) : null}
        <p className="av-label mt-8">{categoryName}</p>
        <PageIntro title={item.name} />
        <p className="mt-4 max-w-2xl text-lg text-[var(--av-text-secondary)]">{item.oneLiner}</p>
      </Reveal>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="text-sm font-semibold">Om produkten</h2>
            <article className="mt-3 space-y-4 text-sm leading-relaxed text-[var(--av-text-secondary)]">
              {raw.body.split("\n\n").map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </article>
          </section>
          <dl className="av-card grid gap-4 p-7 text-sm sm:grid-cols-2">
            {facts.map((row) => (
              <div key={row.label}>
                <dt className="av-label">{row.label}</dt>
                <dd className="mt-1 font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
          {raw.printRequirements.length ? (
            <section>
              <h2 className="text-sm font-semibold">Etiketten måste innehålla</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--av-text-secondary)]">
                {raw.printRequirements.map((r) => (
                  <li key={r.code}>{r.label}</li>
                ))}
              </ul>
            </section>
          ) : null}
          <section>
            <h2 className="text-sm font-semibold">Så går det till</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--av-text-secondary)]">
              <li>Välj volym, antal och kork.</li>
              <li>Skapa konto i kassan. Då visas priset.</li>
              <li>Skicka artwork nu eller senare.</li>
              <li>Aqua skickar korrektur och orderbekräftelse. Därefter leverans.</li>
            </ol>
          </section>
          {raw.specText ? (
            <details className="av-card p-7 text-sm">
              <summary className="cursor-pointer font-medium">Teknisk specifikation</summary>
              <pre className="mt-3 whitespace-pre-wrap leading-relaxed text-[var(--av-text-secondary)]">{raw.specText}</pre>
            </details>
          ) : null}
        </div>
        <aside id="bestall" className="av-config-dock scroll-mt-24">
          {isWater ? (
            <ProductCheckout
              productId={item.id}
              slug={item.slug}
              name={item.name}
              moq={raw.moq}
              variants={item.variants}
              canSeePrices={seePrices}
              me={user?.email ? { email: user.email, customerId: user.customerId ?? null } : null}
            />
          ) : (
            <div className="av-config p-6">
              <p className="text-sm text-[var(--av-text-secondary)]">Den här produkten beställs via offert.</p>
              <PillLink href={`/offert?product=${item.id}`}>Begär offert</PillLink>
            </div>
          )}
        </aside>
      </div>
    </PublicPage>
  );
}
