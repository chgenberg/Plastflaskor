import { Reveal } from "@/ui/motion/Reveal";
import { PageIntro, PublicPage } from "@/ui/public/PageIntro";

export default function ThanksPage() {
  return (
    <PublicPage narrow>
      <Reveal>
        <div className="text-center">
          <PageIntro title="Tack!" align="center" />
          <p className="mt-4 text-[var(--av-text-secondary)]">Vi återkommer med offert.</p>
        </div>
      </Reveal>
    </PublicPage>
  );
}
