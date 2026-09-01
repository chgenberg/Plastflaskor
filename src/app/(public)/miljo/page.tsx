import { PAGE_IMAGES } from "@/domain/pageImages";
import { Reveal } from "@/ui/motion/Reveal";
import { EditorialShot, PageIntro, PublicPage } from "@/ui/public/PageIntro";

export default function EnvironmentPage() {
  return (
    <PublicPage narrow>
      <Reveal>
        <PageIntro badge="Miljö" title="Vi tar ansvar för miljön - miljövänliga profilerade muggar och flaskor" />
        <EditorialShot src={PAGE_IMAGES.miljoKompost} alt="Komposterbar pappersmugg" />
      </Reveal>
      <div className="mt-8 space-y-4 text-[var(--av-text-secondary)]">
        <p>
          Var snällare mot miljön med organiska pappersmuggar med tryck och vattenflaska av återanvänd plast. Vi
          anstränger oss som företag för att minska miljöpåverkan och klimatavtryck. När du handlar av oss bidrar du
          därmed till en mer hållbar miljö.
        </p>
        <h2 className="av-serif pt-6 text-2xl tracking-[-0.01em] text-[var(--av-text)]">
          Pappersmuggar med tryck – utan att bidra till ”slit och släng”-mentalitet
        </h2>
        <p>
          Vi erbjuder biologiskt nedbrytbara pappersmuggar, något som vi är väldigt stolta över. Dessa trycks med ett
          budskap som kunden själv väljer. Muggarna innehåller inga giftiga kemikalier som kan skada miljön.
        </p>
        <h2 className="av-serif pt-6 text-2xl tracking-[-0.01em] text-[var(--av-text)]">PET-flaskorna och burkarna har pant</h2>
        <p>
          Alla våra etiketter är försedda med pantsymbol och streckkod. Detta för att flaskan eller burken, efter sin
          förbrukning, skall kunna pantas och skickas tillbaka till Returpack. Panten är 1 krona (SEK).
        </p>
        <h2 className="av-serif pt-6 text-2xl tracking-[-0.01em] text-[var(--av-text)]">
          Vår sportflaska är tillverkad av återvinningsbar plast
        </h2>
        <p>
          För de kunder som vill ha en sportflaska att fylla på själv, finns vår egna sportflaska aquarefill. Denna
          produkt får kundens eget tryck. Vi är stolta över att kunna erbjuda en budskapsbärare som inte bara är lokalt
          producerad i Sverige, utan också ingår i återvinningssystemet.
        </p>
        <EditorialShot src={PAGE_IMAGES.valSortiment} alt="Sortiment med återvinningsbara förpackningar" className="aspect-[16/10]" />
        <h2 className="av-serif pt-6 text-2xl tracking-[-0.01em] text-[var(--av-text)]">Hållbara transporter</h2>
        <p>
          Våra produkter produceras till stor del i Sverige, och i övrigt inom EU. Detta innebär att de slipper långa
          båt- och flygfrakter från fjärran.
        </p>
        <EditorialShot src={PAGE_IMAGES.offertLeverans} alt="Leverans inom Sverige och EU" className="aspect-[16/10]" />
      </div>
    </PublicPage>
  );
}
