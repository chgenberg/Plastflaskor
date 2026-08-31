import { PAGE_IMAGES } from "@/domain/pageImages";
import { EditorialShot, PageIntro, PillLink } from "@/ui/public/PageIntro";

export default function ResellerLanding() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-16">
      <PageIntro badge="Återförsäljare" title="För återförsäljare" />
      <EditorialShot src={PAGE_IMAGES.aterforsaljareKit} alt="Samplekit för återförsäljare" />
      <p className="mt-5 text-[var(--av-text-secondary)]">
        Vi jobbar i första hand mot återförsäljare inom profil- och presentreklam samt butikskedjor. I portalen ser du
        dina priser, orderhistorik, artwork och kan göra repeat order på under en minut.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <EditorialShot src={PAGE_IMAGES.aterforsaljarePortal} alt="Repeat order i portalen" className="aspect-[4/5]" />
        <EditorialShot src={PAGE_IMAGES.aterforsaljareButik} alt="Kyl i butik och presentreklam" className="aspect-[4/5]" />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <PillLink href="/login?next=/partner">Logga in</PillLink>
        <PillLink href="/offert" variant="ghost">
          Bli återförsäljare
        </PillLink>
      </div>
    </main>
  );
}
