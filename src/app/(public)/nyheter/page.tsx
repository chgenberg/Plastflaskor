import { PAGE_IMAGES } from "@/domain/pageImages";
import { Reveal } from "@/ui/motion/Reveal";
import { EditorialShot, PageIntro, PublicPage } from "@/ui/public/PageIntro";

export default function NewsPage() {
  return (
    <PublicPage narrow>
      <Reveal variant="public">
        <PageIntro badge="Aktuellt" title="Nyheter" />
      </Reveal>
      <article className="av-card av-card-lift mt-10 overflow-hidden">
        <EditorialShot src={PAGE_IMAGES.nyheterEco} alt="ECO-pappersmugg" className="aspect-[16/10] rounded-none" />
        <div className="p-7">
          <p className="av-label">19 nov</p>
          <h2 className="av-serif mt-2 text-2xl tracking-[-0.01em]">Ta en kaffe och KOPPla av!</h2>
          <p className="mt-3 text-[var(--av-text-secondary)]">
            Visste du att vi har koppar som är snälla mot miljön? Kolla in vårt ECO-sortiment.
          </p>
        </div>
      </article>
      <article className="av-card av-card-lift mt-4 overflow-hidden">
        <EditorialShot src={PAGE_IMAGES.nyheterBurk} alt="Energidryck med egen etikett" className="aspect-[16/10] rounded-none" />
        <div className="p-7">
          <p className="av-label">13 okt</p>
          <h2 className="av-serif mt-2 text-2xl tracking-[-0.01em]">Think outside of the burk!</h2>
          <p className="mt-3 text-[var(--av-text-secondary)]">
            Burken, en klassiker sen gammalt. Har du svårt att komma på vad du ska smycka den med?
          </p>
        </div>
      </article>
    </PublicPage>
  );
}
