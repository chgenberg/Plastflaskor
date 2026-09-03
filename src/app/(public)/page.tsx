import { imageForProduct } from "@/domain/productImages";
import { listHomeProducts } from "@/server/services/catalog.service";
import { ClosingCta } from "@/ui/home/ClosingCta";
import { Faq } from "@/ui/home/Faq";
import { FeatureSplits } from "@/ui/home/FeatureSplits";
import { Hero } from "@/ui/home/Hero";
import { ProductDrift } from "@/ui/home/ProductDrift";
import { StatsBand } from "@/ui/home/StatsBand";
import { StepScrollScrub } from "@/ui/home/StepScrollScrub";
import { STEPS } from "@/ui/home/howItWorksSteps";

export default async function HomePage() {
  const water = await listHomeProducts();
  const drift = water.map((p) => ({
    slug: p.slug,
    categorySlug: p.categorySlug,
    name: p.name,
    oneLiner: p.oneLiner,
    image: imageForProduct(p.slug),
  }));
  const first = water[0];

  return (
    <main>
      <Hero />
      <StepScrollScrub steps={STEPS} id="sa-funkar-det" />
      <ProductDrift products={drift} />
      <StatsBand moq={first?.moq ?? 1} leadTimeText={first?.leadTimeText ?? "tre veckor"} />
      <FeatureSplits />
      <Faq />
      <ClosingCta />
    </main>
  );
}
