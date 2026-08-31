import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProductBySlug } from "@/server/services/catalog.service";
import { getSessionUser } from "@/server/rbac";
import { canSeePrices } from "@/domain/policies/priceVisibility";
import { imageForProduct } from "@/domain/productImages";
import { productFacts } from "@/domain/productFacts";
import { PageIntro, PillLink } from "@/ui/public/PageIntro";

export default async function ProductPage({ params }: { params: Promise<{ category: string; product: string }> }) {
  const { category, product } = await params;
  const item = await getPublicProductBySlug(product);
  if (!item || item.categorySlug !== category) notFound();
  const user = await getSessionUser();
  const showResellerCta = !canSeePrices(user?.role);
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
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="av-label">{category}</p>
      <PageIntro title={item.name} />
      <p className="mt-4 text-lg text-[var(--av-text-secondary)]">{item.oneLiner}</p>
      {img ? (
        <div className="relative mt-8 aspect-[4/5] overflow-hidden rounded-[var(--av-radius-lg)]">
          <Image src={img} alt={item.name} fill className="object-cover" sizes="720px" priority />
        </div>
      ) : null}
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
        <PillLink href={`/designa/${item.slug}`}>
          {item.categorySlug === "kyl" ? "Designa din kyl" : item.categorySlug === "pappersmuggar" ? "Designa din mugg" : "Designa din flaska"}
        </PillLink>
        <PillLink href={`/offert?product=${item.id}`} variant="ghost">
          Begär offert
        </PillLink>
        {showResellerCta ? (
          <PillLink href="/login" variant="ghost">
            Logga in för priser
          </PillLink>
        ) : null}
      </div>
      {showResellerCta ? (
        <p className="mt-5 text-sm text-[var(--av-text-secondary)]">
          Är du återförsäljare?{" "}
          <Link href="/login?next=/partner/priser" className="font-medium text-[var(--av-accent)]">
            Logga in för priser
          </Link>
        </p>
      ) : null}
      <article className="mt-12 space-y-4 text-sm leading-relaxed text-[var(--av-text-secondary)]">
        {item.body.split("\n\n").map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </article>
    </main>
  );
}
