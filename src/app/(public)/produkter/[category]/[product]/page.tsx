import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProductBySlug } from "@/server/services/catalog.service";
import { getSessionUser } from "@/server/rbac";
import { canSeePrices } from "@/domain/policies/priceVisibility";
import { imageForProduct } from "@/domain/productImages";
import { PageIntro, PillLink } from "@/ui/public/PageIntro";

export default async function ProductPage({ params }: { params: Promise<{ category: string; product: string }> }) {
  const { category, product } = await params;
  const item = await getPublicProductBySlug(product);
  if (!item || item.categorySlug !== category) notFound();
  const user = await getSessionUser();
  const showResellerCta = !canSeePrices(user?.role);
  const img = imageForProduct(item.slug);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-36">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#766a62]">{category}</p>
      <PageIntro title={item.name} />
      <p className="mt-4 text-lg text-[var(--av-text-secondary)]">{item.oneLiner}</p>
      {img ? (
        <div className="relative mt-8 aspect-[4/5] overflow-hidden rounded-[28px]">
          <Image src={img} alt={item.name} fill className="object-cover" sizes="720px" priority />
        </div>
      ) : null}
      <dl className="mt-10 grid gap-4 rounded-[28px] bg-white p-7 text-sm shadow-[0_2px_12px_rgba(0,0,0,0.05)] sm:grid-cols-2">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.14em] text-[#766a62]">Minsta beställningsantal</dt>
          <dd className="mt-1 font-medium">{item.moq} st</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.14em] text-[#766a62]">Leveranstid</dt>
          <dd className="mt-1 font-medium">{item.leadTimeText}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.14em] text-[#766a62]">Produktionsland</dt>
          <dd className="mt-1 font-medium">{item.country}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.14em] text-[#766a62]">Miljö</dt>
          <dd className="mt-1 font-medium">{item.environmentText}</dd>
        </div>
      </dl>
      <pre className="mt-4 whitespace-pre-wrap rounded-[28px] bg-white p-7 text-sm leading-relaxed text-[var(--av-text-secondary)] shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        {item.specText}
      </pre>
      <div className="mt-8 flex flex-wrap gap-3">
        <PillLink href={`/designa/${item.slug}`}>
          {item.categorySlug === "kyl" ? "Designa din kyl" : "Designa din flaska"}
        </PillLink>
        <PillLink href={`/offert?product=${item.id}`} variant="ghost">
          Begär offert
        </PillLink>
      </div>
      {showResellerCta ? (
        <p className="mt-5 text-sm text-[var(--av-text-secondary)]">
          Är du återförsäljare?{" "}
          <Link href="/login?next=/partner/priser" className="font-medium text-[#1d1d1f]">
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
