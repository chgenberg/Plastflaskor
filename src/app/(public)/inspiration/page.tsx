import { PAGE_IMAGES } from "@/domain/pageImages";
import { Reveal } from "@/ui/motion/Reveal";
import { EditorialShot, PageIntro, PillLink, PublicPage } from "@/ui/public/PageIntro";

const SHOTS = [
  { src: PAGE_IMAGES.valAntal, alt: "Profilvatten på event", title: "Event" },
  { src: PAGE_IMAGES.omService, alt: "Service och profilprodukter", title: "Service" },
  { src: PAGE_IMAGES.omBryggeri, alt: "Läsk och julmust", title: "Bryggeri" },
  { src: PAGE_IMAGES.miljoKompost, alt: "Pappersmugg", title: "Muggar" },
  { src: PAGE_IMAGES.aterforsaljareButik, alt: "Kyl i butik", title: "Butik" },
  { src: PAGE_IMAGES.valSortiment, alt: "Sortiment", title: "Sortiment" },
] as const;

export default function InspirationPage() {
  return (
    <PublicPage>
      <Reveal variant="public">
        <PageIntro badge="Inspiration" title="Referenser och användning" />
        <p className="mt-4 max-w-2xl text-[var(--av-text-secondary)]">
          Profilvatten, dryck och flaskor med egen etikett. Priser och order ligger i kundportalen.
        </p>
      </Reveal>
      <Reveal variant="public">
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SHOTS.map((s) => (
            <figure key={s.src} className="av-card av-card-lift overflow-hidden">
              <EditorialShot src={s.src} alt={s.alt} className="aspect-[4/5] rounded-none" />
              <figcaption className="px-6 py-4 text-sm font-medium">{s.title}</figcaption>
            </figure>
          ))}
        </div>
      </Reveal>
      <div className="mt-10">
        <PillLink href="/login">Logga in till kundportalen</PillLink>
      </div>
    </PublicPage>
  );
}
