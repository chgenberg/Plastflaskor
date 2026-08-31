import { PAGE_IMAGES } from "@/domain/pageImages";
import { EditorialShot, PageIntro, PillLink } from "@/ui/public/PageIntro";

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
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-16">
      <PageIntro badge="Inspiration" title="Produkter människor faktiskt använder" />
      <p className="mt-4 max-w-2xl text-[var(--av-text-secondary)]">
        Profilvatten, muggar, dryck och flaskor med egen design. Bläddra och starta sedan i studion.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SHOTS.map((s) => (
          <figure key={s.src} className="av-card overflow-hidden">
            <EditorialShot src={s.src} alt={s.alt} className="aspect-[4/5] rounded-none" />
            <figcaption className="px-6 py-4 text-sm font-medium">{s.title}</figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-10">
        <PillLink href="/designa">Starta design</PillLink>
      </div>
    </main>
  );
}
