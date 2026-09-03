# 04 — Startsida i tre akter

Startsidan är skärm 1 i köpflödet. Den ska på en viewport svara på "vad är det här" och på nästa
"hur gör jag", och sedan skjuta besökaren rakt in på produktsidan (skärm 2, fil 02). Förebilden är
BillboardBees `src/app/page.tsx` (Repo A, `/Users/christophergenberg/Desktop/Billboardbee-2.0`), men
allt nedan är anpassat till profilvatten, Aquas tokens och Aquas kontrakt.

## Mål

Tre akter, sedan fyra lugna stödsektioner. Ordningen i `src/app/(public)/page.tsx` blir:

| # | Sektion | Roll | Primär länk |
|---|---------|------|-------------|
| Akt 1 | `Hero` | Statisk en-viewport-hero, fyra scener med scen-dots (konferens · hotell · event · gym) | `Beställ profilvatten` → produktsida, `Så funkar det` → `#sa-funkar-det` |
| Akt 2 | `StepScrollScrub` | Pinnad scroll-scrub "Så funkar det", fyra steg | Steg 4 avslutas med länk till produktsidan |
| Akt 3 | `ProductDrift` | Produktkort som driver in med parallax, ersätter BBB:s `FlyingSigns` | Varje kort → `/produkter/{categorySlug}/{slug}` |
| 4 | `StatsBand` | Fyra siffror i ett kort | — |
| 5 | `FeatureSplits` | Två bild/text-splittar: etikettkvalitet, miljö | `/produkter/profilvatten`, `/miljo` |
| 6 | `Faq` | Fem `<details>` | — |
| 7 | `ClosingCta` | Mörkt `rounded-[32px]`-kort | `Beställ profilvatten` → produktsida |

Footern (`PublicFooter` i `src/ui/public/PublicChrome.tsx`) behålls oförändrad.

### Copyförslag per sektion (du-form, kort)

**Akt 1 — Hero**
- Eyebrow: `Profilvatten med er etikett`
- H1: `Vatten som bär ert namn.` (Fraunces, `av-serif`, `em` i `--av-accent-italic` på "ert namn")
- Ingress: `Svenskt källvatten i 33 eller 50 cl PET. Du designar etiketten, vi sköter resten.`
- CTA primär: `Beställ profilvatten` · CTA sekundär: `Så funkar det`
- Scen-captions: `På konferensbordet` · `På hotellrummet` · `På eventet` · `I gymmet`

**Akt 2 — Så funkar det**
- Eyebrow: `Så funkar det` · H2: `Från idé till flaska.` + `<span class="text-muted">Utan omvägar.</span>`
- 01 `Välj flaska och volym` — `33 eller 50 cl, stilla eller kolsyrat. Antal från 270 flaskor.`
- 02 `Designa etiketten eller ladda upp` — `Rita direkt i studion eller släpp in er färdiga fil. Du ser flaskan uppdateras medan du jobbar.`
- 03 `Beställ` — `Konto skapas i kassan, inget att fylla i före. Du får en orderbekräftelse med exakt det du godkände.`
- 04 `Vi sköter etikett, tappning och leverans` — `Etikettproducent, tappning i Dalarna, frakt till er dörr. Normalt tre veckor.`

**Akt 3 — ProductDrift**
- Eyebrow: `Sortimentet` · H2: `Välj flaskan.` `<span>Resten är etikett.</span>`
- Ingress: `Tre profilvatten att börja med. Klicka på en flaska för storlek, kork och antal.`
- Knapp: `Se alla produkter` → `/produkter`

**StatsBand** (värden hämtas från katalogen där de finns)
- `Inget att betala vid beställning` — `faktura efter leverans`
- `Från 270 flaskor` — `minsta antal per order` (`item.moq`, se `prisma/seed.ts` rad 106)
- `3 veckor` — `normal leveranstid` (`leadTimeText`, `prisma/seed.ts` rad 107)
- `Dalarna` — `Tollagårdens källa`

**FeatureSplits**
1. Eyebrow `Etiketten` · H2 `Skarp etikett, varje gång.` · Text: `Papper eller transparent film, tryckt hos en etikettproducent som gör det här varje dag. Du ser exakt hur den sitter på flaskan innan du beställer.` · Chips: `Papper eller transparent` · `Förhandsvisning på flaskan`
2. Eyebrow `Miljö` · H2 `Svensk källa, korta transporter.` · Text: `Vattnet tappas i Dalarna, flaskorna ger pant och etiketten trycks i Sverige. Kort väg från källa till konferensbord.` · Chips: `Pant på varje flaska` · `Tappat i Dalarna` · Länk `Läs mer om miljö →` → `/miljo`

**FAQ** (fem)
- `Hur många flaskor måste jag beställa?` · `Hur lång tid tar det?` · `Kan jag skicka en egen etikettfil?` · `Vad händer efter att jag beställt?` · `Kan jag ändra designen efter beställning?`

**ClosingCta**
- H2 `Redo att sätta ert namn på flaskan?` · Text `Välj storlek, designa etiketten och beställ. Antal och leveranstid ser du innan du skickar.` · Knapp `Beställ profilvatten`

Ingen text nämner AI eller modellnamn. Där något automatiseras heter det "agenten" (t.ex. FAQ-svaret om vad
som händer efter beställning: "agenten skickar artwork till etikettproducenten och bokar tappning").

## Vad BBB gör

| Komponent | Fil (Repo A) | Teknik | Reduced-motion-fallback |
|-----------|--------------|--------|-------------------------|
| `CinematicHero` | `src/components/home/cinematic/cinematic-hero.tsx` | `"use client"`, `useState(active)`, fyra `<picture>` staplade `absolute inset-0` med `<source media="(max-width: 767px)">` porträtt + landskap `<img>`, `transition-opacity duration-700`, två scrims (`from-black/75 via-black/35`, botten `h-1/3`), scen-dots `aria-pressed` + caption, `.animate-cue`-pil, `min-h-[calc(100svh-64px)]`. `fetchPriority="high"` på scen 0. Scroll byter aldrig bild. | Ingen scroll-motion att stänga av; `.animate-cue` dödas av `[class*="animate-"] { animation: none }` i `src/app/globals.css` rad 429–431. |
| `StepScrollScrub` | `src/components/home/cinematic/step-scroll-scrub.tsx` | Tre lägen via `matchMedia` (rad 56–71): `reduce` → `static`, `<1024` → `mobile`, annars `pinned`. SSR renderar alltid `static`. Pinned: sektion `height: steps.length*100svh` (rad 345), inre `sticky top-0 h-svh` (rad 348), progress `-rect.top / (rect.height - innerHeight)` i rAF (rad 79–87), crossfade `transition-[opacity,transform] duration-700` med `scale-[1.06]` på inaktiv (rad 147–149). Mobile: `IntersectionObserver threshold 0.55` autoplayar video på skärm (rad 103–113). Steglista med `max-h-40`-expansion för aktiv body. | `static` = staplad layout, allt innehåll synligt, poster-bild, noll rörelse. |
| Stegdata | `src/components/home/how-it-works-steps.ts` | Ren datamodul utan `"use client"` så servern kan importera `STEPS` utan client-reference-proxy. `StepDef { n, title, body, image, alt, video?, videoMobile?, imageMobile? }`. | n/a |
| `FlyingSigns` | `src/components/home/cinematic/flying-signs.tsx` | Sex hand-placerade `SLOTS` i vänster/höger-rännor (rad 32–39), en passiv rAF-scroll-lyssnare som skriver `translate3d + rotate` från `c = (p-0.5)*2` (rad 60–75). Bara `lg+` och utan reduce. Kort är riktiga `<Link>`, wrapper `pointer-events-none`, kort `pointer-events-auto`. | Under `lg` eller reduce: statiskt `grid-cols-2 sm:grid-cols-3` (rad 206–208); effekten avbryts i `useEffect` rad 54–55. |
| `StatsBand` | `src/components/home/landing-sections.tsx` rad 20–45 | Server-komponent, fyra värden i `rounded-3xl`-kort, `grid-cols-2 sm:grid-cols-4`, insvept i `Reveal`. | `Reveal` sätter `is-in` direkt vid reduce. |
| `FeatureSplits` | samma fil rad 64–160 | Alternerande `lg:grid-cols-2`, `order-last lg:order-first` på bild 2, `Image fill` med `.parallax-media` (baseline `scale(1.2)`, globals rad 369–372), `FeatureChip` `absolute` med `.animate-float` / `.animate-float-slow` + `float-delay-*`. | `.parallax-media { transform: none }` rad 373–377; `animate-*` dödas globalt. |
| `Faq` | samma fil rad 310–338 | Native `<details>` + `<summary>`, `list-none`, `[&::-webkit-details-marker]:hidden`, `+` roterar `group-open:rotate-45 duration-300`. Noll JS. | Fungerar utan JS; rotation är bara transition. |
| `ClosingCta` | samma fil rad 343–375 | `rounded-[32px] bg-black`, två `blur-3xl`-glows (`bg-accent/25`, `bg-cerise/20`), centrerad H2 + en knapp. | Statisk. |
| `ParallaxController` | `src/components/home/parallax.tsx` | Returnerar `null`; en rAF-lyssnare panorerar alla `.parallax-media` `±8 %` av egen höjd (rad 27–41). | Bail om reduce (rad 18). |
| `SiteHeader` | `src/components/home/site-header.tsx` | `data-scrolled={scrolled}` från `scrollY > 8` (rad 41–47), CSS `.site-header` transparent → `rgba(247,247,245,0.82) + blur(12px)` (globals rad 394–405). `alwaysScrolled` för heron. | n/a |

BBB använder `lucide-react` (`ArrowRight`, `Sparkles`, `ChevronDown`, `Mail`). Aqua har inte paketet;
alla ikoner blir inline-SVG som `TruckIcon`/`LeafIcon`/`StarIcon` redan är i dagens `page.tsx` rad 247–272.

## Vad Aqua har idag

`src/app/(public)/page.tsx` (272 rader) är en server-komponent med nio `Reveal`-insvepta sektioner:

1. Hero-split (rad 27–60): `Badge` + H1 "Behöver ni svalka?" + `PillLink` **`/login`** ("Kundportal →") och `/produkter`, tre USP-rader, `av-media aspect-[4/5]` med `PAGE_IMAGES.valAntal`.
2. Kategorigrid 6 kort (rad 62–84) → `/produkter/{kategori}`.
3. 21:9-band `PAGE_IMAGES.produkterHero` (rad 86–96).
4. "Svensk källa"-split (rad 98–119).
5. "4 anledningar" fyra `av-card` (rad 121–153).
6. Textsplit "aqua visibility - profilvatten med egen etikett" (rad 155–178).
7. "Våra populäraste produkter" från `listProducts()` (rad 180–202).
8. Tre kort `/login`, `/offert`, `/inspiration` (rad 204–224).
9. Nyhetsbrev-`Surface` med formulär utan `action` (rad 226–242).

Återanvänds: `Reveal` (`src/ui/motion/Reveal.tsx`, IO 0.12 + reduce-bail), `Badge`, `PillLink`, `Surface`
från `src/ui/public/PageIntro.tsx`, `LinkButton`/`Button` från `src/ui/shell/primitives.tsx`,
`listProducts()` + `imageForProduct()` för Akt 3, klasserna `.av-media`, `.av-card`, `.av-lift`,
`.av-public-band`, `.av-label`, `.av-serif` (`src/app/styles/tokens.css`, `src/app/globals.css`), och
sektion 4:s text som råmaterial till FeatureSplit 2. Tas bort: sektion 1 (ersätts av `Hero`), 2 och 7
(ersätts av `ProductDrift`), 5, 6, 8 (CTA:er till login/offert stämmer inte med köpflödet) och 9
(formuläret postar ingenstans). `PublicNav` (`src/ui/public/PublicNav.tsx`) är alltid frostad
`bg-[var(--av-surface)]/85 backdrop-blur-md` (rad 86) och har ingen scroll-state.

Bilder som finns under `public/`: `Images/1a.png`–`10a.png` (startsidans tio Nano Banana-scener),
`Images/pages/*.png` (20 sidbilder), `Images/products/*.png` (7 SKU:er), `Images/_LOOK_*` (7) och
`Images/MISC/*` (14) omärkta editorial-PNG, `editorial/hero-circle-{bottle,person,source}.jpg`,
`editorial/label-meadow.jpg`, `brand/aqua-visibility-logo.png`. Ingen porträttbeskärning finns, ingen WebP,
ingen `public/home/`.

## Ändringar

Alla nya filer under `src/ui/home/` (mappen finns inte idag). Inga nya npm-paket.

### `src/ui/home/heroScenes.ts` (ny, ren data)
`HeroScene { id, src, portrait, pos, caption }`, fyra scener: `konferens`, `hotell`, `event`, `gym`.
Ingen `"use client"` — samma skäl som BBB:s `hero-scenes.ts`.

### `src/ui/home/Hero.tsx` (ny, `"use client"`)
Port av `cinematic-hero.tsx` utan `SiteHeader`, utan sökfält, utan i18n.
- `min-h-[calc(100svh-64px)]` (PublicNav är `h-16`), `bg-[var(--av-ink)]`.
- Fyra `<picture>` staplade, `<source media="(max-width: 767px)" srcSet={portrait}>`, scen 0 `fetchPriority="high" loading="eager"`, övriga `lazy`. Explicit `width`/`height` på `<img>` för CLS 0.
- Scrims som BBB. Text i vitt på mörkt: eyebrow med `h-1.5 w-1.5 rounded-full bg-[var(--av-accent)]`, H1 `av-serif`.
- CTA: `PillLink href="/produkter/profilvatten/naturligt-mineralvatten-33cl"` (canonical slug bestäms av fil 02; kategorisidan `/produkter/profilvatten` är fallback) + `PillLink variant="ghost" href="#sa-funkar-det"`.
- Scen-dots `role="group" aria-label="Välj bildscen"`, `aria-pressed`, caption `hidden sm:inline`. Scroll-pil med `.av-animate-cue` (fil 05).
- Ingen scroll-lyssnare. Reduced motion: `transition-opacity` stängs av via `[class*="av-animate-"]`-blocket i fil 05; dots fungerar fortfarande.

### `src/ui/home/howItWorksSteps.ts` (ny, ren data)

```ts
export type StepDef = {
  n: string; title: string; body: string;
  image: string; imageMobile?: string; alt: string;
  video?: string; videoMobile?: string;
};
export const STEPS: StepDef[] = [
  { n: "01", title: "Välj flaska och volym", body: "33 eller 50 cl, stilla eller kolsyrat. Antal från 270 flaskor.",
    image: "/home/steg-1.webp", imageMobile: "/home/steg-1-mobile.webp", alt: "Produktsidan med 33 cl vald" },
  { n: "02", title: "Designa etiketten eller ladda upp", body: "Rita direkt i studion eller släpp in er färdiga fil.",
    image: "/home/steg-2.webp", imageMobile: "/home/steg-2-mobile.webp", alt: "Etikettstudion med flaskan uppdaterad" },
  { n: "03", title: "Beställ", body: "Konto skapas i kassan, inget att fylla i före.",
    image: "/home/steg-3.webp", imageMobile: "/home/steg-3-mobile.webp", alt: "Kassan med orderrader" },
  { n: "04", title: "Vi sköter etikett, tappning och leverans", body: "Etikett, tappning i Dalarna, frakt. Normalt tre veckor.",
    image: "/home/steg-4.webp", imageMobile: "/home/steg-4-mobile.webp", alt: "Orderbekräftelse med leveransdatum" },
];
```

Video är valfritt; V1 kör stillbilder (skärmdumpar av skärm 2–4 när de finns, annars renderade mockups).

### `src/ui/home/StepScrollScrub.tsx` (ny, `"use client"`)
Port av `step-scroll-scrub.tsx` utan `control="click"`-grenen, `cn` och `useT`. Behåll de tre lägena
och att SSR alltid är `static`. Kärnan:

```tsx
useEffect(() => {
  if (mode !== "pinned") return;
  const el = sectionRef.current; if (!el) return;
  let raf = 0;
  const update = () => {
    raf = 0;
    const r = el.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const p = total > 0 ? Math.min(total, Math.max(0, -r.top)) / total : 0;
    setActive((c) => { const i = Math.min(steps.length - 1, Math.floor(p * steps.length + 1e-4)); return c === i ? c : i; });
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  update();
  addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll, { passive: true });
  return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
}, [mode, steps.length]);
```

Pinned-markup: `<section id="sa-funkar-det" style={{ height: `${steps.length * 100}svh` }}>` med inre
`sticky top-0 h-svh`. Stage-bilder använder `.av-stage-panel[data-active]` från fil 05 i stället för
Tailwind-transition-strängen. Steglistan: aktivt kort `border-[var(--av-ink)] bg-[var(--av-surface)]`,
inaktivt `border-[var(--av-border)] bg-[var(--av-surface)]/50`. Sista steget får en `PillLink` till
produktsidan under body-texten. Mobile-läget behöver ingen IntersectionObserver när det bara är bilder;
lägg till den bara om `video` sätts.

### `src/ui/home/ProductDrift.tsx` (ny, `"use client"`)
Port av `flying-signs.tsx`. Tar `products: { slug, categorySlug, name, oneLiner, image }[]` (server
mappar `listProducts()` + `imageForProduct()` i `page.tsx`, max sex, profilvatten först). Samma
`SLOTS`-koordinater; kortets aspect blir `4/5` (flaska stående) i stället för `4/3`. Bakgrund
`bg-[var(--av-ink)]`, knapp vit `rounded-full`. Under `lg` och vid reduce: `grid-cols-2 sm:grid-cols-3`
med `av-lift`. `will-change-transform` på korten.

### `src/ui/home/StatsBand.tsx` (ny, server)
Tar `moq: number` och `leadTimeText: string` från första profilvatten-produkten. Fyra kolumner i ett
`av-card`, värden i `av-serif text-4xl sm:text-5xl tabular-nums`. Ingen `kr`-sträng.

### `src/ui/home/FeatureSplits.tsx` (ny, server)
Två splittar som BBB rad 74–158. Bild i `.av-media` med `.av-parallax-media` (fil 05), `FeatureChip`
lokal komponent med `.av-animate-float` / `.av-animate-float-slow` / `.av-float-delay-*` (fil 05). Bilder:
`/home/split-etikett.jpg` (4:3, 1120×840) och `/home/split-miljo.jpg` (4:3).

### `src/ui/home/Faq.tsx` (ny, server)
Native `<details>` som BBB rad 320–333, `av-card`-klass i stället för `border-line`, `+`-tecknet i
`text-[var(--av-text-muted)]`. Inga `Reveal`-wrappers runt varje rad på mobil om det ger CLS; en `Reveal`
runt hela listan räcker.

### `src/ui/home/ClosingCta.tsx` (ny, server)
`rounded-[32px] bg-[var(--av-ink)]`, en glow `bg-[var(--av-accent)]/25 blur-3xl` (ingen cerise —
kontraktet förbjuder orange/cerise). Knapp `PillLink` till produktsidan.

### `src/ui/home/ParallaxController.tsx` (ny, `"use client"`)
Port av `parallax.tsx` med selector `.av-parallax-media` och `TRAVEL = 8`. Renderas en gång i `page.tsx`.

### `src/app/(public)/page.tsx` (ändrad)
Server-komponent. Hämtar `listProducts()`, plockar profilvatten-produkterna, bygger `drift`-listan och
`moq`/`leadTimeText`. Renderar `<Hero/>`, `<ParallaxController/>`, `<StepScrollScrub steps={STEPS} id="sa-funkar-det"/>`,
`<ProductDrift products={drift}/>`, `<StatsBand .../>`, `<FeatureSplits/>`, `<Faq/>`, `<ClosingCta/>`.
`<main>` tappar `pt-16` (heron börjar direkt under nav). Behåll `export const dynamic = "force-dynamic"`
via `(public)/layout.tsx` — sätt inget eget i sidan.

### `src/ui/public/PublicNav.tsx` (valfritt, liten ändring)
Lägg till prop `overHero?: boolean`. När `true`: `useEffect` med `scrollY > 8` → `data-scrolled` på
`<header>`, klassen `av-site-header` i stället för de hårdkodade `bg-[var(--av-surface)]/85 backdrop-blur-md`
(rad 86). CSS `.av-site-header[data-scrolled="true"]` definieras i fil 05. Logotypen är mörk PNG, så
över mörk hero behöver den antingen `brightness-0 invert` när `data-scrolled="false"` eller en vit
variant `public/brand/aqua-visibility-logo-white.png`. Om det inte hinns: hoppa över, heron är redan
`calc(100svh-64px)` och fungerar under en alltid-frostad nav.

### Bildbehov (`public/home/`)

| Fil | Format | Storlek | Källa |
|-----|--------|---------|-------|
| `hero-konferens.jpg` + `-portrait.jpg` | JPG q80 | 2400×1350 / 1080×1920 | `content/nano-banana-pro-prompts.md` scen 2 (Stockholmskontor) eller ny "konferensbord" |
| `hero-hotell.jpg` + `-portrait.jpg` | JPG | samma | ny scen: 50 cl stilla på hotellskrivbord, linne, kvällsljus — LOOK från `nano-banana-2-sidor.md` |
| `hero-event.jpg` + `-portrait.jpg` | JPG | samma | `nano-banana-pro-prompts.md` scen 7 (Sommarevent) eller scen 1 (Mässmonter) |
| `hero-gym.jpg` + `-portrait.jpg` | JPG | samma | `nano-banana-pro-prompts.md` scen 6 (Gym) — men med 33/50 cl PET, inte Aquarefill |
| `steg-1..4.webp` + `-mobile.webp` | WebP | 1440×900 / 860×1864 | skärmdumpar av skärm 2–4 när fil 02–03 är klara |
| `split-etikett.jpg`, `split-miljo.jpg` | JPG | 1120×840 | `nano-banana-2-sidor.md` §14 (etikett papper/transparent) och §4 (korta transporter) |

Befintliga `Images/1a–10a.png` kan tills vidare mappas till hero-scenerna om de matchar motiven, men de är
PNG i en storlek och saknar porträtt — byt till JPG-paret före lansering för LCP.

## Kontraktskontroll

- **Inga `kr` publikt.** StatsBand skriver `Inget att betala vid beställning`, inte `0 kr`. `ProductDrift`-korten visar namn + `oneLiner`, aldrig pris. Grep `kr` i `src/ui/home/` ska ge noll träffar.
- **Agenten, aldrig AI.** Copy ovan följer det. Inga modellnamn i alt-texter eller captions.
- **Ingen orange/cerise.** `ClosingCta` har bara accent-glow; `bg-cerise` från BBB portas inte.
- **Inga nya npm-paket.** `lucide-react` ersätts av inline-SVG, `cn` ersätts av template-strängar, `next/image` finns redan.
- **`prefers-reduced-motion`.** `Hero` har ingen scroll-motion; `StepScrollScrub` tvingar `static`; `ProductDrift`, `ParallaxController` bailar; CSS-hjälparna i fil 05 nollställs i reduce-blocket i `src/app/globals.css` (rad 59–73 idag).
- **CTA → produktsida.** Ingen länk på startsidan går till `/login` eller `/offert` (nav och footer äger de ingångarna). Dagens `Kundportal →` i heron försvinner.
- **Prislista blandas inte.** Startsidan läser bara `listProducts()` (namn, slug, oneLiner, moq, leadTimeText). Inga `PriceListItem`.
- **Registry-driven.** Produkterna i Akt 3 kommer från katalogen, inte hårdkodade slugs utöver ordningen.

## Acceptanskriterier

1. Lighthouse mobil (Moto G-profil) på `/`: Performance ≥ 85, Accessibility ≥ 95, CLS ≤ 0,05, LCP ≤ 2,5 s. Hero-scen 0 är LCP-elementet och har `fetchPriority="high"` + explicita mått.
2. `prefers-reduced-motion: reduce` i DevTools: ingen transform/opacity ändras vid scroll; `StepScrollScrub` visar alla fyra steg staplade; scen-dots byter bild utan fade; sidan är komplett.
3. JS avstängt: heron visar scen 0 med H1 och båda CTA:erna; "Så funkar det" renderas staplad (SSR `static`); FAQ öppnas/stängs; alla produktkort är klickbara länkar.
4. 390 px bred viewport: `document.documentElement.scrollWidth === 390`, ingen horisontell overflow; hero-porträttbild visas; `ProductDrift` visar grid, inga absoluta kort.
5. 1024 px och uppåt: `StepScrollScrub` pinnar, aktivt steg byts vid 25/50/75 % av sektionens scroll; `ProductDrift`-korten rör sig och är klickbara under hela rörelsen.
6. Tangentbord: scen-dots nåbara med Tab, `aria-pressed` uppdateras; FAQ `summary` har synlig fokusring; inga fokusfällor i pinned-läget.
7. `rg -n "kr\b" src/ui/home src/app/\(public\)/page.tsx` → 0 träffar. `rg -in "\bAI\b" src/ui/home` → 0 träffar.
8. Alla CTA-knappar på startsidan pekar mot `/produkter/...` eller `#sa-funkar-det`; ingen mot `/login` eller `/offert`.
9. `next build` utan varningar om `Image` utan `sizes`, och inga `"use client"`-moduler importeras för sitt data-värde av server-komponenter (`STEPS` och `HERO_SCENES` ligger i rena `.ts`-filer).
10. Footer (`PublicFooter`) oförändrad, byte-identisk mot `main`.

## Beroenden

- **Fil 02 (produktsida).** Bestämmer canonical URL som alla `Beställ profilvatten`-knappar pekar på och levererar skärmdumparna till `steg-1..4`. Startsidan kan byggas mot `/produkter/profilvatten/naturligt-mineralvatten-33cl` (finns i `prisma/seed.ts` rad 90–94) och justeras när 02 landar.
- **Fil 05 (CSS-hjälpare).** Äger `.av-parallax-media`, `.av-stage-panel[data-active]`, `.av-site-header[data-scrolled]`, `.av-animate-float`, `.av-animate-float-slow`, `.av-float-delay-1..3`, `.av-animate-cue` och reduce-blocket som nollställer dem. Utan 05 renderar sidan men utan parallax/float/cue.
- Katalogen (`src/server/services/catalog.service.ts` `listProducts`) för Akt 3 och StatsBand — finns redan.

## Uppskattad storlek

- Nya filer: 10 (`heroScenes.ts`, `Hero.tsx`, `howItWorksSteps.ts`, `StepScrollScrub.tsx`, `ProductDrift.tsx`, `StatsBand.tsx`, `FeatureSplits.tsx`, `Faq.tsx`, `ClosingCta.tsx`, `ParallaxController.tsx`), ca 650 rader TSX/TS totalt.
- Ändrade: `src/app/(public)/page.tsx` (272 → ca 60 rader), ev. `PublicNav.tsx` (+15 rader).
- Bilder: 8 hero-JPG, 8 steg-WebP, 2 split-JPG = 18 filer, ca 6 MB innan optimering.
- Arbetstid: 1,5 dag kod (porten är mekanisk), 0,5 dag bildgenerering och beskärning, 0,5 dag Lighthouse/reduced-motion/390 px-verifiering. Totalt ~2,5 dagar, utan beroende på 02 för att komma igång.
