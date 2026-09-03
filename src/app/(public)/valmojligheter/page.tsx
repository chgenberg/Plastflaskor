import { PAGE_IMAGES } from "@/domain/pageImages";
import { Reveal } from "@/ui/motion/Reveal";
import { EditorialShot, PageIntro, PublicPage } from "@/ui/public/PageIntro";

export default function OptionsPage() {
  return (
    <PublicPage narrow>
      <Reveal variant="public">
        <PageIntro badge="Valmöjligheter" title="Vi erbjuder följande sortiment:" />
        <EditorialShot src={PAGE_IMAGES.valSortiment} alt="Hela sortimentet" />
      </Reveal>
      <ul className="mt-8 grid gap-2 text-lg font-medium">
        <li>Pappersmuggar</li>
        <li>Profilvatten</li>
        <li>Sportflaskor</li>
        <li>Energidryck</li>
        <li>Läsk & Must</li>
        <li>Kyl</li>
      </ul>
      <div className="mt-10 space-y-5 text-[var(--av-text-secondary)]">
        <p>
          <strong className="text-[var(--av-text)]">Antal</strong> Vår produktion är mångsidig. Ni har möjlighet att köpa från
          270 flaskor med egen etikett. Detta innebär att även event med få deltagare kan erbjudas kundanpassad
          vattenflaska.
        </p>
        <EditorialShot src={PAGE_IMAGES.valAntal} alt="Från 270 flaskor" className="aspect-[16/10]" />
        <p>
          <strong className="text-[var(--av-text)]">Flaska – Burk</strong> Våra standardflaskor är 33 cl och 50 cl. Vår
          Energidryck kommer i en aluminiumburk på 25 cl
        </p>
        <p>
          <strong className="text-[var(--av-text)]">Etikett</strong> Det är etiketten som skall kommunicera just Ert budskap.
          Här finns det många kreativa lösningar som vi gärna berättar mer om. Våra standardetiketter är av
          miljöriktigt material som går att välja mellan vit eller transparent bakgrund med fyrfärgstryck.
        </p>
        <EditorialShot src={PAGE_IMAGES.valEtikett} alt="Pappersetikett och transparent etikett" className="aspect-[16/10]" />
        <p>
          <strong className="text-[var(--av-text)]">Hållbarhet</strong> Stilla vatten 18 månader. Kolsyrat vatten 9 månader.
          Läsk 9 månader. Energidryck 12-24 månader.
        </p>
        <p>
          <strong className="text-[var(--av-text)]">Kork</strong> Ett bra sätt att ge flaskan en längre livstid är att förse
          den med en sk sportkork. Skruvkork finns i svart, vit, blå och röd. Sportkork finns i svart, vit och blå.
        </p>
        <EditorialShot src={PAGE_IMAGES.valKork} alt="Skruvkork och sportkork" className="aspect-[16/10]" />
        <p>
          <strong className="text-[var(--av-text)]">Leveranstid</strong> Är det bråttom och Ni behöver få fram en produktion
          snabbt? Ring oss!
        </p>
        <p>
          <strong className="text-[var(--av-text)]">Streckkod och pantsymbol</strong> Alla våra etiketter är försedda med
          pantsymbol och streckkod. Detta för att flaskan efter sin förbrukning skall kunna pantas och skickas tillbaka
          till Returpack. Panten är en krona.
        </p>
        <div>
          <p className="font-semibold text-[var(--av-text)]">Beställa. Följande krävs för en komplett order:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Storlek på flaskan?</li>
            <li>Kolsyrat eller stilla vatten?</li>
            <li>Vilken kork samt färg?</li>
            <li>Antal flaskor?</li>
            <li>Typ av etikett?</li>
            <li>Önskat leveransdatum?</li>
            <li>Leveransuppgifter? Glöm ej namn och mobnr till godsmottagare.</li>
            <li>Skicka till order@aquavisibility.se. Glöm ej eventuell fakturamärkning.</li>
          </ol>
        </div>
      </div>
    </PublicPage>
  );
}
