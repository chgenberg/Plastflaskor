import { Reveal } from "@/ui/motion/Reveal";
import { PillLink } from "@/ui/public/PageIntro";
import { ORDER_HREF } from "./heroScenes";

export function ClosingCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10">
      <Reveal variant="public">
        <div className="relative overflow-hidden rounded-[32px] bg-[var(--av-ink)] px-6 py-16 text-center sm:px-12 sm:py-20">
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--av-accent)]/25 blur-3xl" />
          <h2 className="av-serif relative text-3xl text-white sm:text-5xl">Redo att sätta ert namn på flaskan?</h2>
          <p className="relative mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
            Välj storlek, designa etiketten och beställ. Antal och leveranstid ser du innan du skickar.
          </p>
          <div className="relative mt-8">
            <PillLink href={ORDER_HREF}>Beställ profilvatten</PillLink>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
