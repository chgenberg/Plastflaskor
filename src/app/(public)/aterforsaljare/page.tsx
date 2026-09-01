import { PAGE_IMAGES } from "@/domain/pageImages";
import { Reveal } from "@/ui/motion/Reveal";
import { EditorialShot, PageIntro, PillLink, PublicPage } from "@/ui/public/PageIntro";

export default function ResellerLanding() {
  return (
    <PublicPage narrow>
      <Reveal>
        <PageIntro badge="Återförsäljare" title="För återförsäljare" />
        <EditorialShot src={PAGE_IMAGES.aterforsaljareKit} alt="Samplekit för återförsäljare" />
      </Reveal>
      <p className="mt-5 text-[var(--av-text-secondary)]">
        Vi jobbar i första hand mot återförsäljare inom profil- och presentreklam samt butikskedjor. Priser, ordrar och
        artwork ligger i kundportalen efter inloggning.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <EditorialShot src={PAGE_IMAGES.aterforsaljarePortal} alt="Repeat order i portalen" className="aspect-[4/5]" />
        <EditorialShot src={PAGE_IMAGES.aterforsaljareButik} alt="Kyl i butik och presentreklam" className="aspect-[4/5]" />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <PillLink href="/login">Logga in till kundportalen</PillLink>
        <PillLink href="/offert" variant="ghost">
          Bli återförsäljare
        </PillLink>
      </div>
    </PublicPage>
  );
}
