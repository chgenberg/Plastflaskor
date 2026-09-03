import { Reveal } from "@/ui/motion/Reveal";
import { Faq as FaqList } from "@/ui/public/Faq";

const ITEMS = [
  {
    q: "Hur många flaskor måste jag beställa?",
    a: "Minsta antal står på produkten. Det är det antal du börjar med i kassan.",
  },
  {
    q: "Hur lång tid tar det?",
    a: "Normal tid står på produkten. Aqua bekräftar datum i orderbekräftelsen.",
  },
  {
    q: "Kan jag skicka en egen etikettfil?",
    a: "Ja. Ladda upp i kassan eller senare i kundportalen. Du kan också rita i studion.",
  },
  {
    q: "Vad händer efter att jag beställt?",
    a: "Agenten meddelar Aqua. Du får korrektur att godkänna. Därefter kommer orderbekräftelse, etikett, tappning och frakt.",
  },
  {
    q: "Kan jag ändra designen efter beställning?",
    a: "Ja, fram till att du godkänt korrektur. När orderbekräftelsen är skickad är designen låst.",
  },
];

export function Faq() {
  return (
    <section aria-label="Vanliga frågor" className="mx-auto w-full max-w-3xl px-4 py-16">
      <Reveal variant="public">
        <h2 className="av-display text-center text-3xl sm:text-4xl">Vanliga frågor</h2>
        <div className="mt-8">
          <FaqList items={ITEMS} />
        </div>
      </Reveal>
    </section>
  );
}
