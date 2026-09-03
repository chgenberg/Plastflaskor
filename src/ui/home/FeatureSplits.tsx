import Image from "next/image";
import Link from "next/link";
import { PAGE_IMAGES } from "@/domain/pageImages";
import { Reveal } from "@/ui/motion/Reveal";
import { FeatureChip } from "@/ui/shell/primitives";

export function FeatureSplits() {
  return (
    <div className="av-public-band space-y-20 py-10">
      <Reveal variant="public">
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="av-media relative aspect-[4/3]">
            <Image src={PAGE_IMAGES.valEtikett} alt="Etikett på flaska" fill className="av-parallax-media object-cover" sizes="560px" />
            <FeatureChip float className="absolute left-4 top-4">Papper eller transparent</FeatureChip>
            <FeatureChip className="av-animate-float-slow av-float-delay-1 absolute bottom-4 right-4">Förhandsvisning på flaskan</FeatureChip>
          </div>
          <div>
            <p className="av-label">Etiketten</p>
            <h2 className="av-serif mt-3 text-4xl tracking-[-0.02em]">Skarp etikett, varje gång.</h2>
            <p className="mt-4 text-[var(--av-text-secondary)]">
              Papper eller transparent film, tryckt hos en etikettproducent som gör det här varje dag. Du ser hur den sitter på flaskan innan du beställer.
            </p>
            <Link href="/produkter/profilvatten" className="mt-6 inline-block text-sm font-medium text-[var(--av-accent)]">
              Se profilvatten →
            </Link>
          </div>
        </section>
      </Reveal>
      <Reveal variant="public">
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="order-last lg:order-first">
            <p className="av-label">Miljö</p>
            <h2 className="av-serif mt-3 text-4xl tracking-[-0.02em]">Svensk källa, korta transporter.</h2>
            <p className="mt-4 text-[var(--av-text-secondary)]">
              Vattnet tappas i Dalarna, flaskorna ger pant och etiketten trycks i Sverige. Kort väg från källa till konferensbord.
            </p>
            <Link href="/miljo" className="mt-6 inline-block text-sm font-medium text-[var(--av-accent)]">
              Läs mer om miljö →
            </Link>
          </div>
          <div className="av-media relative aspect-[4/3]">
            <Image src={PAGE_IMAGES.miljoKompost} alt="Källa och pant" fill className="av-parallax-media object-cover" sizes="560px" />
            <FeatureChip float className="absolute left-4 top-4">Pant på varje flaska</FeatureChip>
            <FeatureChip className="av-animate-float-slow av-float-delay-2 absolute bottom-4 right-4">Tappat i Dalarna</FeatureChip>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
