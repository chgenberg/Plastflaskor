import Image from "next/image";
import Link from "next/link";
import { PAGE_IMAGES } from "@/domain/pageImages";
import { imageForProduct } from "@/domain/productImages";
import { listProducts } from "@/server/services/catalog.service";
import { Badge, PillLink, Surface } from "@/ui/public/PageIntro";

const IMG = {
  energi: "/Images/1a.png",
  kalla: "/Images/2a.png",
  middag: "/Images/3a.png",
  kyl: "/Images/4a.png",
  sport: "/Images/5a.png",
  cafe: "/Images/6a.png",
  golf: "/Images/7a.png",
  mugg: "/Images/8a.png",
  kontor: "/Images/9a.png",
  massa: "/Images/10a.png",
} as const;

export default async function HomePage() {
  const products = await listProducts();
  const featured = products.filter((p) =>
    ["energidryck-med-egen-etikett", "aquarefill", "pappersmugg-ev-23cl", "lask-med-egen-etikett", "profilerbar-kyl"].includes(p.slug),
  );

  return (
    <main>
      <section className="relative overflow-hidden px-4 pb-8 pt-32 text-center md:pt-36">
        <Badge>aqua visibility</Badge>
        <h1 className="av-serif mx-auto mt-6 max-w-4xl text-5xl leading-[1.05] tracking-[-0.01em] text-[#1d1d1f] md:text-7xl">
          Behöver ni <em className="italic text-[var(--av-accent-italic)]">svalka?</em>
        </h1>
        <p className="mt-5 text-[13px] font-medium uppercase tracking-[0.22em] text-[#766a62]">Lugn, vi hjälper er!</p>
        <div className="mt-8">
          <PillLink href="/produkter">Se produkter →</PillLink>
        </div>

        <ul className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-center gap-6 text-[12px] text-[#766a62] sm:flex-row sm:gap-10">
          <li className="flex items-center gap-2">
            <TruckIcon />
            Från 270 flaskor
          </li>
          <li className="flex items-center gap-2">
            <LeafIcon />
            Tollagården i Dalarna
          </li>
          <li className="flex items-center gap-2">
            <StarIcon />
            Superb service
          </li>
        </ul>

        <div className="relative mx-auto mt-16 flex h-[240px] max-w-5xl items-end justify-center md:h-[340px]">
          {[
            { src: PAGE_IMAGES.valAntal, alt: "Profilvatten på event", i: 0 },
            { src: PAGE_IMAGES.omService, alt: "Service och profilprodukter", i: 1 },
            { src: PAGE_IMAGES.omBryggeri, alt: "Läsk och julmust", i: 2 },
          ].map((c) => (
            <div
              key={c.src}
              className="absolute overflow-hidden rounded-full ring-4 ring-[#f5f5f7]"
              style={{
                width: c.i === 1 ? "min(38vw, 340px)" : "min(30vw, 260px)",
                height: c.i === 1 ? "min(38vw, 340px)" : "min(30vw, 260px)",
                left: c.i === 0 ? "8%" : c.i === 1 ? "50%" : "auto",
                right: c.i === 2 ? "8%" : "auto",
                transform: c.i === 1 ? "translateX(-50%)" : undefined,
                bottom: c.i === 1 ? "-12%" : "-6%",
                zIndex: c.i === 1 ? 2 : 1,
              }}
            >
              <Image src={c.src} alt={c.alt} fill className="object-cover" sizes="340px" priority={c.i === 1} />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-6 pt-20 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Sportflaskor", href: "/produkter/sportflaskor", src: imageForProduct("aquarefill")! },
          { label: "Pappersmuggar", href: "/produkter/pappersmuggar", src: imageForProduct("pappersmugg-ev-23cl")! },
          { label: "100% Energi!", href: "/produkter/energidryck", src: imageForProduct("energidryck-med-egen-etikett")! },
          { label: "Läsk", href: "/produkter/lask-must", src: imageForProduct("lask-med-egen-etikett")! },
          { label: "Kyl", href: "/produkter/kyl", src: imageForProduct("profilerbar-kyl")! },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="group">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[#eee] shadow-sm transition-shadow duration-500 group-hover:shadow-xl group-hover:shadow-black/[0.08]">
              <Image src={c.src} alt={c.label} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 1024px) 50vw, 25vw" />
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 pb-[3px] pt-[5px] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1d1d1f] shadow-sm backdrop-blur-sm">
                {c.label}
              </span>
            </div>
            <h2 className="av-serif mt-4 text-2xl tracking-[-0.01em]">{c.label}</h2>
            <p className="mt-1 text-sm text-[#766a62] transition-colors group-hover:text-[#1d1d1f]">Se sortimentet →</p>
          </Link>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="relative aspect-[16/9] overflow-hidden rounded-[32px] md:aspect-[21/9]">
          <Image src={PAGE_IMAGES.produkterHero} alt="Sortiment med egen etikett" fill className="object-cover" sizes="1100px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
          <p className="absolute bottom-6 left-6 max-w-md text-left text-sm font-medium text-white md:bottom-10 md:left-10 md:text-base">
            Läsk PET 50cl från anrika Mora Bryggeri.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="relative mx-auto aspect-square w-full max-w-[460px] overflow-hidden rounded-full">
            <Image src={PAGE_IMAGES.miljoKompost} alt="Pappersmugg och profilvatten" fill className="object-cover" sizes="460px" />
          </div>
          <div>
            <Badge>Kopp(LA) av,</Badge>
            <h2 className="av-serif mt-5 text-4xl tracking-[-0.01em] md:text-5xl">Med en kaffe eller vatten i profilerade Pappersmuggar!</h2>
            <p className="mt-5 text-[var(--av-text-secondary)]">
              Behöver ditt företag energidryck med er egen logotyp, eller läsk med egen etikett? Få leverans inom en månad
              och bästa möjliga service från ett pålitligt företag.
            </p>
            <div className="mt-8">
              <PillLink href="/produkter/pappersmuggar">Se pappersmuggar →</PillLink>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center">
          <Badge>Varför vi</Badge>
          <h2 className="av-serif mx-auto mt-5 max-w-2xl text-4xl tracking-[-0.01em] md:text-5xl">4 anledningar att välja oss</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {[
            [
              "Superb service är vårt främsta fokus!",
              "”WOW!” Så vill vi att du ska känna när du pratat med någon av vår personal. När vi får ett mail svarar vi på det så fort som möjligt. God service är för oss en principsak. Så jobbar vi på aqua visibility!",
            ],
            [
              "Lokala leverantörer för bättre miljö.",
              "Vi vill att även kommande generationer skall kunna få avnjuta en ren miljö. Därför jobbar vi med svenska och europeiska leverantörer, för ett så litet miljöavtryck som möjligt i våra produkter. Våra burkar ger pant.",
            ],
            [
              "Vi förstärker ditt varumärke.",
              "Våra produkter kommer i förpackningar av hög kvalitet, med drycker från en naturlig källa i Dalarna, och från ett välrenommerat bryggeri bland annat. Det märks på slutprodukten du får levererad av oss!",
            ],
            [
              "Hur många måste man köpa?",
              "Vi erbjuder custom-anpassade produkter och försöker alltid anpassa antalet efter era behov och önskemål. Ni har möjlighet att köpa från 270 flaskor med egen etikett. Det gör det enklare för dig att nå ut med ditt budskap till dina kunder!",
            ],
          ].map(([t, b]) => (
            <article key={t} className="rounded-[28px] bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <h3 className="av-serif text-2xl tracking-[-0.01em]">{t}</h3>
              <p className="mt-4 text-sm leading-relaxed text-[var(--av-text-secondary)]">{b}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <h2 className="av-serif text-3xl tracking-[-0.01em] md:text-4xl">aqua visibility - profilvatten med egen etikett</h2>
            <h3 className="av-serif mt-10 text-2xl tracking-[-0.01em]">Några exempel på produkter vi erbjuder</h3>
            <ul className="mt-5 space-y-2 text-[var(--av-text-secondary)]">
              <li>Kolsyrat och stilla vatten med egen etikett</li>
              <li>Läsk, julmust och energidryck med egen etikett</li>
              <li>Sportflaska/vattenflaska med egen etikett</li>
              <li>Engångsmugg som är biologiskt nedbrytbar</li>
            </ul>
            <p className="mt-8 text-sm leading-relaxed text-[var(--av-text-secondary)]">
              Vi jobbar i första hand mot återförsäljare inom profil- och presentreklam samt butikskedjor och liknande som
              vill ha drycker med egen etikett. Dryckerna tillverkas inom Europa, främst i Sverige, och håller mycket god
              kvalitet.
            </p>
          </div>
          <div className="relative order-1 mx-auto aspect-square w-full max-w-[460px] overflow-hidden rounded-full md:order-2">
            <Image src={PAGE_IMAGES.aterforsaljarePortal} alt="Profilvatten på kontoret" fill className="object-cover" sizes="460px" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="av-serif text-center text-3xl tracking-[-0.01em]">Våra populäraste produkter</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <Link key={p.id} href={`/produkter/${p.categorySlug}/${p.slug}`} className="group">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[24px]">
                <Image
                  src={imageForProduct(p.slug) ?? IMG.massa}
                  alt={p.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="25vw"
                />
              </div>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#766a62]">{p.categorySlug}</p>
              <h3 className="av-serif mt-2 text-xl tracking-[-0.01em]">{p.name}</h3>
              <p className="mt-2 text-sm text-[var(--av-text-secondary)]">{p.oneLiner}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <Surface className="text-center">
          <h2 className="av-serif text-3xl tracking-[-0.01em]">Häng med i matchen!</h2>
          <p className="mx-auto mt-3 max-w-lg text-[var(--av-text-secondary)]">
            Signa upp dig på vårt nyhetsbrev så missar du aldrig en spännande nyhet och kan vara först ut med alla
            spännande produkter
          </p>
          <form className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <input className="h-[52px] flex-1 rounded-full border border-[var(--av-border)] bg-[#f5f5f7] px-5" placeholder="E-post" />
            <button className="h-[52px] rounded-full bg-[#1d1d1f] px-6 text-sm font-semibold text-white" type="button">
              Anmäl
            </button>
          </form>
        </Surface>
      </section>
    </main>
  );
}

function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="17.5" r="1.5" fill="currentColor" />
      <circle cx="17" cy="17.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 13c6-8 14-8 14-8s0 8-8 14c-2 1.5-6 0-6-6Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 15c2-3 5-6 9-8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="m12 3.5 2.4 5.2 5.6.6-4.2 3.8 1.2 5.5L12 15.8 6.99 18.6l1.2-5.5L4 9.3l5.6-.6L12 3.5Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
