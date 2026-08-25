import { PAGE_IMAGES } from "@/domain/pageImages";
import { EditorialShot, PageIntro } from "@/ui/public/PageIntro";

export default function NewsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-36">
      <PageIntro badge="Aktuellt" title="Nyheter" />
      <article className="mt-10 overflow-hidden rounded-[28px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <EditorialShot src={PAGE_IMAGES.nyheterEco} alt="ECO-pappersmugg" className="aspect-[16/10] rounded-none" />
        <div className="p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#766a62]">19 nov</p>
          <h2 className="av-serif mt-2 text-2xl tracking-[-0.01em]">Ta en kaffe och KOPPla av!</h2>
          <p className="mt-3 text-[var(--av-text-secondary)]">
            Visste du att vi har koppar som är snälla mot miljön? Kolla in vårt ECO-sortiment.
          </p>
        </div>
      </article>
      <article className="mt-4 overflow-hidden rounded-[28px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <EditorialShot src={PAGE_IMAGES.nyheterBurk} alt="Energidryck med egen etikett" className="aspect-[16/10] rounded-none" />
        <div className="p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#766a62]">13 okt</p>
          <h2 className="av-serif mt-2 text-2xl tracking-[-0.01em]">Think outside of the burk!</h2>
          <p className="mt-3 text-[var(--av-text-secondary)]">
            Burken, en klassiker sen gammalt. Har du svårt att komma på vad du ska smycka den med?
          </p>
        </div>
      </article>
    </main>
  );
}
