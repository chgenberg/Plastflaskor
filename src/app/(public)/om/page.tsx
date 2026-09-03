import { PAGE_IMAGES } from "@/domain/pageImages";
import { Reveal } from "@/ui/motion/Reveal";
import { EditorialShot, PageIntro, PublicPage } from "@/ui/public/PageIntro";

export default function AboutPage() {
  return (
    <PublicPage narrow>
      <Reveal variant="public">
        <PageIntro badge="Om oss" title="Mässprodukter och profilprodukter för företag" />
        <EditorialShot src={PAGE_IMAGES.omService} alt="Service och kommunikation" />
      </Reveal>
      <div className="mt-8 space-y-4 text-[var(--av-text-secondary)]">
        <p>
          Företaget utvecklar, marknadsför och distribuerar dryck med kundanpassad förpackning och etikett. Vi jobbar
          huvudsakligen mot återförsäljare, som profil- och presentreklambranschen, reklambyråer och butikskedjor.
          Slutkunderna är företag i alla storlekar, från de minsta till de allra största, som behöver mässprodukter och
          profilprodukter att marknadsföra sig med.
        </p>
        <h2 className="av-serif pt-6 text-2xl tracking-[-0.01em] text-[var(--av-text)]">I huvudsak svenska produkter</h2>
        <p>
          Vi är ett stockholmsbaserat företag med säte i Vallentuna, som har cirka tio års erfarenhet i bagaget. Vi
          tillhör de första i Sverige som började med profilerade drycker, och har i dag upparbetat ett pålitligt
          nätverk som möjliggör att vi kan lösa de allra flesta behov inom vår nisch.
        </p>
        <p>
          Det naturliga mineralvattnet tas från en källa i Dalarna där även förädling och produktion sker. Vår läsk och
          julmust kommer från anrika Mora Bryggeri. Övrig produktion sker inom Europa, vilket innebär att vi undviker
          långa transporter som skadar miljön.
        </p>
        <EditorialShot src={PAGE_IMAGES.omBryggeri} alt="Läsk och julmust från Mora Bryggeri" className="aspect-[16/10]" />
        <h2 className="av-serif pt-6 text-2xl tracking-[-0.01em] text-[var(--av-text)]">Service är alltid i fokus</h2>
        <p>
          En god service är det främsta. Vi brinner för att lösa problem åt kunderna, vilket innebär att vi värderar en
          god kommunikation. Hos oss får du ofta svar inom kort, en vana vi har haft sedan företaget startades. Vi
          brukar säga att vi tycker om att svara på mail – för det gör vi.
        </p>
        <h2 className="av-serif pt-6 text-2xl tracking-[-0.01em] text-[var(--av-text)]">Hög kvalitet till ett rimligt pris</h2>
        <p>
          Flera av våra kunder återkommer år efter år för att beställa profilprodukter för företag, och det ser vi som
          ett kvitto på att vi gör rätt. Det är smart att bli kund på lång sikt, då samma original kan återanvändas år
          efter år när nya dryckesprodukter ska produceras.
        </p>
        <p className="pt-6 text-[var(--av-text)]">
          Joakim VD
          <br />
          08-400 204 80
          <br />
          info@aquavisibility.se
        </p>
      </div>
    </PublicPage>
  );
}
