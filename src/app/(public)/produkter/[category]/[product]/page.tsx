import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublicProductBySlug } from "@/server/services/catalog.service";
import { getSessionUser } from "@/server/rbac";
import { canSeePrices } from "@/domain/policies/priceVisibility";
import { imageForProduct } from "@/domain/productImages";
import { productFacts } from "@/domain/productFacts";
import { Reveal } from "@/ui/motion/Reveal";
import { PageIntro, PillLink, PublicPage } from "@/ui/public/PageIntro";

export default async function ProductPage({ params }: { params: Promise<{ category: string; product: string }> }) {
  const { category, product } = await params;
  const item = await getPublicProductBySlug(product);
  if (!item || item.categorySlug !== category) notFound();
  const user = await getSessionUser();
  const showLoginForPrices = !canSeePrices(user?.role);
  const img = imageForProduct(item.slug);
  const variant = item.variants[0];
  const facts = productFacts({
    moq: item.moq,
    leadTimeText: item.leadTimeText,
    country: item.country,
    environmentText: item.environmentText,
    volumeMl: variant?.volumeMl,
    optionsJson: variant?.optionsJson,
    specText: item.specText,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description: item.oneLiner,
    category,
    brand: { "@type": "Brand", name: "aqua visibility" },
  };

  return (
    <PublicPage narrow>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Reveal>
        <p className="av-label">{category}</p>
        <PageIntro title={item.name} />
        <p className="mt-4 text-lg text-[var(--av-text-secondary)]">{item.oneLiner}</p>
        {img ? (
          <div className="av-media mt-8 aspect-[4/5]">
            <Image src={img} alt={item.name} fill className="object-cover" sizes="720px" priority />
          </div>
        ) : null}
      </Reveal>
      <dl className="av-card mt-10 grid gap-4 p-7 text-sm sm:grid-cols-2">
        {facts.map((row) => (
          <div key={row.label}>
            <dt className="av-label">{row.label}</dt>
            <dd className="mt-1 font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
      <pre className="av-card mt-4 whitespace-pre-wrap p-7 text-sm leading-relaxed text-[var(--av-text-secondary)]">
        {item.specText}
      </pre>
      <div className="mt-8 flex flex-wrap gap-3">
        {item.categorySlug === "profilvatten" ? (
          <PillLink href={user ? "/konto/ordrar/ny" : "/login?next=/konto/ordrar/ny"}>
            {user ? "Beställ i kundportalen" : "Logga in och beställ"}
          </PillLink>
        ) : null}
        <PillLink href={`/offert?product=${item.id}`} variant={item.categorySlug === "profilvatten" ? "ghost" : undefined}>
          Begär offert
        </PillLink>
        {showLoginForPrices && item.categorySlug === "profilvatten" ? (
          <PillLink href="/login" variant="ghost">
            Logga in för priser
          </PillLink>
        ) : null}
      </div>
      <article className="mt-12 space-y-4 text-sm leading-relaxed text-[var(--av-text-secondary)]">
        {item.body.split("\n\n").map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </article>
    </PublicPage>
  );
}
