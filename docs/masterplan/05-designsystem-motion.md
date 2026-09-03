# 05 — Designsystem & motion

## Mål

Ett rörelse- och ytspråk som gör att publik sajt, kassa/orderpopup (`<dialog class="av-peek">`, `src/ui/order/OrderPeek.tsx` 31–48) och de fyra dashboards (`(konto)`, `(operations)`, `(labels)`, `(bottler)`) känns som ett system. Vi lånar **tekniken** från Billboardbee-2.0 (html.js-gatad reveal, parallax utan paket, sticky stage-paneler, header som frostas vid scroll, float/cue-keyframes, ett globalt reduced-motion-kill-switch) men behåller **Aquas färg och typografi**: `--av-accent #005caf`, `--av-bg #f6f5f2`, Inter + Fraunces (`.av-serif`), radier 6/8/12 som är skarpare än BBB:s 10/14/18. Inga nya npm-paket, ingen `lucide-react`, ingen orange/cerise.

Två tempon: publika sidor får längre, mjukare rörelse (0.6–0.7 s, 16 px); dashboards behåller `--av-t 220ms`. Etikett/bottler-ytorna ärver bara tempot, inte hero-effekterna.

## Vad BBB gör

Repo: `/Users/christophergenberg/Desktop/Billboardbee-2.0`. Inga motion-paket i `package.json` (bara `lucide-react` för ikoner, rad 20).

- `src/app/globals.css` 9–41 `@theme`: färger 10–24 (`--color-accent #f5a623`, `--color-cerise #de3163`), fonts 26–27 (Inter för både body och display), radier 30–34 (`10/14/18/24`), skuggor 37–38 (`--shadow-soft`, `--shadow-pop`), `--animate-spin-slow` 40.
- `.font-display` 116–121: `font-weight 700; letter-spacing -0.03em; line-height 1.04`.
- `.hairline` 124–126, `.soft-focus` 133–138 (4 px orange ring), `.grow-underline` 156–165.
- `.card-lift` 205–215: `translateY(-4px)` + `--shadow-soft`, 0.3 s `cubic-bezier(0.2,0.7,0.2,1)`.
- `.no-scrollbar` 218–224.
- Marquee 301–312: `.marquee-track` 55 s, **pause-on-hover/focus-within** 309–312.
- `@keyframes float-soft` 319–333: `.animate-float` 6 s, `.animate-float-slow` 8.5 s, `.float-delay-1/2/3` med negativ delay; `card-breathe`/`.animate-breathe` 339–346.
- `.reveal` 352–360: 0.7 s transition, dolt läge `translateY(24px)` gatat på `html.js .reveal:not(.in-view)`. `html.js` sätts av inline-script i `src/app/layout.tsx` 54–61 (`suppressHydrationWarning` på `<html>`, rad 53).
- `.parallax-media` 369–377: baslinje `scale(1.2)`, `transform: none` under reduce. Drivs av `src/components/home/parallax.tsx` 16–59 (rAF-scroll, `TRAVEL = 8` %, bail vid reduce rad 18).
- `.stage-panel` 380–391: crossfade 0.45 s via `[data-active="true|false"]`, `pointer-events: none` på inaktiv.
- `.site-header` 394–405: transparent → `rgba(247,247,245,0.82)` + `backdrop-filter: blur(12px)` när `[data-scrolled="true"]`.
- `@keyframes cue-bounce` + `.animate-cue` 408–414.
- Reduced motion 417–426 (reveal/stage) och 429–443: `[class*="animate-"]`, `.marquee-track`, `.card-lift`, `.grow-underline`.
- `.bb-chart` 449–477: Unovis-variabler med hårdkodade brand-hex.
- `src/components/ui/button.tsx`: varianter 14–20, storlekar 22–26 (`h-9/h-11/h-[52px]`, radier 10/12/14), `arrow`-prop med `ArrowRight` från lucide (rad 4).
- `src/components/ui/badge.tsx` 18–38: `rounded-full`, 9 px uppercase, tonkarta 8–16.
- `src/components/ui/disclosure.tsx` 8–29: native `<details>/<summary>`, chevron roterar via `group-open:rotate-90`.
- `src/components/home/reveal.tsx` 20–36: IntersectionObserver `threshold 0.15`, `rootMargin -10%`, lägger till `.in-view`, one-shot.
- Finns **inte**: `src/components/ui/cards.tsx` (mappen har bara `badge.tsx`, `button.tsx`, `disclosure.tsx`, `logo.tsx`). Kortlyft är enbart klassen `.card-lift`.

## Vad Aqua har idag

Repo: `/Users/christophergenberg/Desktop/Par_tryckeri`. Tailwind v4, Next 15.5, inga motion-paket, ingen `lucide-react`.

- `src/app/styles/tokens.css` (804 rader) 1–59 `:root`: palett `--av-blue/gray/green/yellow/red/slate`, fonts 26–28 (Inter, Fraunces, IBM Plex Mono), semantik 30–41, status 43–50, `--av-radius-sm/md/lg 6/8/12` 52–54, `--av-shadow-sm/md` 55–56, `--av-ease cubic-bezier(0.22,1,0.36,1)` 57, `--av-t-fast 120ms` / `--av-t 220ms` 58–59.
- `.av-card` 62–67 (ingen skugga), `a.av-card`/`.av-lift` 69–78 (`translateY(-2px)` + `--av-shadow-md`), `.av-media` 80–94 (bild `scale(1.04)` 500 ms), `.av-btn` 96–106 (`scale(0.98)` på active), `.av-reveal` 109–118 (`translateY(10px)`, `--av-t`, **ingen html.js-gate → dolt innehåll utan JS**), `.av-public-page` 120–129, `.av-public-band` 131–141.
- Shell/nav 330–529, KPI 561–602, `.av-peek` dialog 739–804 (`--av-shadow-md`, backdrop `rgba(20,20,20,0.32)`).
- Hårdkodade hex inuti tokens.css-klasser: `#faf9f6` (294, 298), `#f3f1eb` (334, 527), `#fff` (452). Inga hex i `src/**/*.tsx` utanför `src/ui/studio/engine/**` (etikettmotorns färgdata, exkluderas medvetet).
- `src/app/globals.css` (74 rader): `@theme inline` 4–12 mappar `--color-accent`, `--font-serif`, `--radius-lg`; `@keyframes av-marquee` + `.av-marquee` 42–53 (55 s, **ingen paus på hover, används inte i någon `.tsx`**); `.av-serif` 55–57; reduced-motion 59–74.
- `src/app/layout.tsx` 26–30: `<html lang="sv">` utan js-klass.
- `src/ui/motion/Reveal.tsx` 5–46: client-komponent, reduce-check 20–23, IO `threshold 0.12`, `rootMargin -6%` (31), klass `av-reveal is-in` (40). Används på 8 publika sidor, 9 gånger på `(public)/page.tsx`.
- `src/ui/shell/primitives.tsx`: `btnBase` 361, `btnH` 362–366 (`h-8/h-10/h-12`), `btnVariant` 367–371 (alla `rounded-[var(--av-radius-md)]`), `LinkButton` 380–408, `Button` 410–422, `FilterChip` 424–447 (redan `rounded-full` vid `solid`), `controlClass` 343–344, `StatusChip` 5–28, `KpiCard` 50–64, `DashTable` 309–337.
- `src/ui/public/PageIntro.tsx`: `Badge` 5–11 (`rounded-md`), `PageIntro` 13–33 (`av-serif`, `tracking -0.02em`, `leading 1.08`), `PillLink` 35–49 (heter pill men är `--av-radius-md`), `Surface` 51–53, `EditorialShot` 55–61.
- `src/ui/public/PublicNav.tsx` 90: header är alltid frostad (`bg-[var(--av-surface)]/85 backdrop-blur-md`), ingen scroll-state.
- Klassanvändning i `.tsx`: `av-card` 32, `av-serif` 23, `av-media` 12, `av-lift` 11, `av-public-band` 9.

## Ändringar

### Token-diff (BBB → Aqua → beslut)

- `--color-bg #ffffff` → `--av-bg #f6f5f2` → **behåll Aqua**.
- `--color-accent #f5a623` / `--color-cerise` → `--av-accent #005caf` → **behåll Aqua, adoptera aldrig orange/cerise**.
- `--font-display` (Inter 700) → `.av-serif` (Fraunces) → **behåll Fraunces**, lägg till `.av-display` som låser vikt/spärr/radhöjd.
- `--radius-sm/md/lg 10/14/18` → `6/8/12` → **behåll Aqua**.
- `--radius-xl 24px` → saknas → **lägg till `--av-radius-xl: 20px`** (BBB:s 24 blir för mjukt mot 12; 20 räcker för hero-kort och `.av-peek` på stora skärmar).
- `--shadow-soft` → `--av-shadow-md` → **lägg till `--av-shadow-soft`** (två lager, för lyft) och behåll `--av-shadow-md` för statiska paneler.
- `--shadow-pop` → saknas → **lägg till `--av-shadow-pop`**, används endast av `.av-peek` och `.av-stage-panel`.
- Ingen BBB-motsvarighet → **lägg till `--av-stage: #0b0d10`** + `--av-stage-fg`, `--av-stage-muted`, `--av-stage-accent` (se Kontraktskontroll).
- `--animate-spin-slow` → **adoptera inte**.
- `cubic-bezier(0.2,0.7,0.2,1)` 0.3–0.7 s → `--av-ease` 120/220 ms → **behåll `--av-ease`, lägg till `--av-t-slow: 640ms`** för publika reveal/parallax.
- `.bb-chart` → **adoptera inte** (ingen Unovis i Aqua).

### CSS — `src/app/styles/tokens.css`

Lägg tokens sist i `:root` (efter rad 59), klasserna direkt efter `.av-reveal.is-in` (rad 118).

```css
  /* :root-tillägg */
  --av-radius-xl: 20px;
  --av-shadow-soft: 0 1px 2px rgba(20, 20, 20, 0.04), 0 8px 24px rgba(20, 20, 20, 0.06);
  --av-shadow-pop: 0 16px 48px rgba(20, 20, 20, 0.14);
  --av-t-slow: 640ms;
  --av-stage: #0b0d10;
  --av-stage-fg: #f6f5f2;
  --av-stage-muted: rgba(246, 245, 242, 0.72);
  --av-stage-accent: var(--av-blue-100);
```

```css
/* Display-typografi: Fraunces med låst vikt/spärr så h1:or blir lika överallt */
.av-display {
  font-family: var(--av-font-serif);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.04;
}

.av-hairline {
  border-top: 1px solid var(--av-border);
}

.av-soft-focus:focus-visible,
.av-soft-focus:focus-within {
  outline: none;
  border-color: var(--av-accent);
  box-shadow: 0 0 0 4px rgba(0, 92, 175, 0.18);
}

/* Ersätter .av-lift: -4px + --av-shadow-soft, samma easing men publikt tempo */
.av-card-lift {
  transition:
    transform var(--av-t-slow) var(--av-ease),
    box-shadow var(--av-t-slow) var(--av-ease),
    border-color var(--av-t-slow) var(--av-ease);
}
.av-card-lift:hover {
  transform: translateY(-4px);
  border-color: var(--av-border-strong);
  box-shadow: var(--av-shadow-soft);
}

/* Reveal: dolt läge gatat på html.js så innehåll aldrig försvinner utan JS */
.av-reveal {
  opacity: 1;
  transform: none;
  transition: opacity var(--av-t) var(--av-ease), transform var(--av-t) var(--av-ease);
}
html.js .av-reveal:not(.is-in) {
  opacity: 0;
  transform: translateY(10px);
}
.av-reveal--public {
  transition-duration: var(--av-t-slow);
}
html.js .av-reveal--public:not(.is-in) {
  transform: translateY(16px);
}

/* Parallax: överskanning finns före JS så inga kanter syns */
.av-parallax-media {
  transform: scale(1.2);
  will-change: transform;
}

/* Sticky stage: paneler crossfadar per steg */
.av-stage {
  background: var(--av-stage);
  color: var(--av-stage-fg);
  border-radius: var(--av-radius-xl);
}
.av-stage-panel {
  transition: opacity 0.45s var(--av-ease), transform 0.45s var(--av-ease);
}
.av-stage-panel[data-active="false"] {
  opacity: 0;
  transform: scale(0.985);
  pointer-events: none;
}
.av-stage-panel[data-active="true"] {
  opacity: 1;
  transform: scale(1);
}

/* Header: transparent på hero, frostas när sidan scrollat */
.av-site-header {
  background: transparent;
  border-bottom: 1px solid transparent;
  transition:
    background-color 0.3s var(--av-ease),
    border-color 0.3s var(--av-ease),
    backdrop-filter 0.3s var(--av-ease);
}
.av-site-header[data-scrolled="true"] {
  background: color-mix(in srgb, var(--av-bg) 82%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom-color: var(--av-border);
}

.av-no-scrollbar::-webkit-scrollbar {
  display: none;
}
.av-no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

Konsolidering i samma fil:

- Ta bort `.av-lift`-blocket (69–78) och låt `a.av-card:hover` peka på `.av-card-lift`-värdena. Byt de 11 `av-lift`-förekomsterna i `.tsx` till `av-card-lift`. Ett lyftsystem, inte två.
- Ersätt `#faf9f6` (294, 298) med `color-mix(in srgb, var(--av-bg) 50%, var(--av-surface))`, `#f3f1eb` (334, 527) med ny token `--av-shell-bg: #f3f1eb` i `:root`, `#fff` (452) med `var(--av-surface)`.
- `.av-peek` (739–749): `border-radius: var(--av-radius-xl)`, `box-shadow: var(--av-shadow-pop)`.

### CSS — `src/app/globals.css`

Ersätt raderna 42–74 med:

```css
@keyframes av-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.av-marquee-track {
  animation: av-marquee 55s linear infinite;
  will-change: transform;
}
.av-marquee:hover .av-marquee-track,
.av-marquee:focus-within .av-marquee-track {
  animation-play-state: paused;
}

@keyframes av-float-soft {
  0%, 100% { transform: translateY(0) rotate(var(--av-float-rot, 0deg)); }
  50% { transform: translateY(-10px) rotate(var(--av-float-rot, 0deg)); }
}
.av-animate-float { animation: av-float-soft 6s ease-in-out infinite; will-change: transform; }
.av-animate-float-slow { animation: av-float-soft 8.5s ease-in-out infinite; will-change: transform; }
.av-float-delay-1 { animation-delay: -1.6s; }
.av-float-delay-2 { animation-delay: -3.2s; }
.av-float-delay-3 { animation-delay: -4.8s; }

@keyframes av-cue-bounce {
  0%, 100% { transform: translateY(0); opacity: 0.55; }
  50% { transform: translateY(6px); opacity: 1; }
}
.av-animate-cue { animation: av-cue-bounce 2s ease-in-out infinite; }

.av-serif {
  font-family: var(--av-font-serif);
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  [class*="av-animate-"],
  .av-marquee-track {
    animation: none !important;
  }
  .av-reveal,
  .av-media img,
  a.av-card,
  .av-card-lift,
  .av-btn,
  .av-stage-panel,
  .av-site-header {
    transition: none !important;
  }
  .av-reveal,
  .av-parallax-media,
  .av-card-lift:hover,
  .av-media img {
    transform: none !important;
  }
  .av-reveal { opacity: 1 !important; }
  .av-stage-panel[data-active="false"] { opacity: 0; }
}
```

Marquee-elementet byter från `.av-marquee` (ensam klass) till wrapper `.av-marquee` + inre `.av-marquee-track` (ingen `.tsx` använder klassen idag, så inget bryts).

### `src/app/layout.tsx`

Lägg `suppressHydrationWarning` på `<html>` (rad 27) och ett `<head>` med inline-scriptet `document.documentElement.classList.add('js')` — samma mönster som BBB `layout.tsx` 54–61.

### `src/ui/motion/Reveal.tsx`

- Ny prop `variant?: "public" | "dash"` (default `"dash"`). `"public"` lägger till `av-reveal--public` och använder `threshold 0.15`, `rootMargin "0px 0px -10% 0px"` (BBB-värdena); `"dash"` behåller `0.12` / `-6%`.
- Ta bort `useState`; sätt `is-in` med `el.classList.add` som BBB (`reveal.tsx` 27) så ingen omrendering sker. Behåll reduce-checken (20–23) men den blir belt-and-braces eftersom CSS redan tvingar `opacity: 1`.
- Sidorna under `(public)/` byter till `<Reveal variant="public">`; dashboards behåller default.

### `src/ui/shell/primitives.tsx`

- Ny prop `shape?: "soft" | "pill"` på `Button` och `LinkButton` (default `"soft"`). Flytta `rounded-[var(--av-radius-md)]` ut ur `btnVariant` (367–371) till en `btnShape`-karta: `soft → rounded-[var(--av-radius-md)]`, `pill → rounded-full`.
- Lägg `av-soft-focus` i `btnBase` (361) och `controlClass`/`controlCompact` (343–347).
- Ny `FeatureChip` (rad ~447): `<span class="inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--av-border-strong)] bg-[var(--av-surface)] px-3 text-[12px] font-medium text-[var(--av-text-secondary)]">` med valfri `av-animate-float`-klass via prop `float?: boolean`. Ersätter de inline-listade `TruckIcon/LeafIcon/StarIcon`-raderna på `(public)/page.tsx` 41–54.

### `src/ui/public/PageIntro.tsx`

- `PageIntro` h1 (rad 27): byt `av-serif ... leading-[1.08] tracking-[-0.02em]` mot `av-display`.
- `PillLink` (35–49): skicka `shape="pill"`; behåll `size="lg"`. Hero-CTA på publika sidor blir därmed rund, dashboards förblir `--av-radius-md`.
- `Badge` (5–11): behåll (tonneutral, `rounded-md`); `FeatureChip` är för ikon+text-rader, `Badge` för eyebrow.

### Ny `src/ui/public/Faq.tsx`

Server-komponent utan state, native `<details>` som BBB `disclosure.tsx` men utan lucide:

```tsx
export function Faq({ items }: { items: { q: string; a: React.ReactNode }[] }) {
  return (
    <div className="av-hairline">
      {items.map((it) => (
        <details key={it.q} className="group border-b border-[var(--av-border)]">
          <summary className="av-soft-focus flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-[var(--av-text)] [&::-webkit-details-marker]:hidden">
            {it.q}
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="shrink-0 transition-transform duration-200 group-open:rotate-45">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </summary>
          <div className="pb-4 text-[14px] leading-relaxed text-[var(--av-text-secondary)]">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
```

### Ny `src/ui/motion/Parallax.tsx` (valfritt i denna etapp, krävs av 02)

Port av BBB `parallax.tsx` 16–59 med selektor `.av-parallax-media`, `TRAVEL = 8`, bail vid reduce. Monteras en gång i `(public)/layout.tsx`.

## Kontraktskontroll

- **Ingen färgändring.** `--av-accent`, `--av-bg`, hela `--av-blue/gray/*`-paletten orörda. De enda nya färgvärdena är `--av-stage`-familjen och `--av-shell-bg` (som bara flyttar ett hex som redan finns i filen).
- **Inga paket.** Allt är CSS, `IntersectionObserver`, `requestAnimationFrame`, native `<details>`/`<dialog>`. Ingen `lucide-react`; ikoner är inline-SVG som i `PublicNav.tsx` 193.
- **Reduced motion.** Ett block i `globals.css` täcker `[class*="av-animate-"]`, marquee, reveal, parallax, stage, header, lift, media-zoom och `.av-btn`. `Reveal.tsx` och `Parallax.tsx` bailar dessutom i JS. `Reveal` tvingas `opacity: 1` så inget innehåll gömts.
- **Utan JS.** `html.js`-gaten gör att `.av-reveal` renderas synlig i SSR/crawlers; dagens `opacity: 0` (tokens.css 110) försvinner.
- **Kontrast på `--av-stage #0b0d10`** (WCAG AA, 4.5:1 normal text): `--av-stage-fg #f6f5f2` ≈ 18.5:1 OK; `--av-stage-muted` (72 % vit) ≈ 10:1 OK; **`--av-accent #005caf` på stage ≈ 2.9:1 — underkänt**, därför pekar `--av-stage-accent` på `--av-blue-100 #d4e6f4` (≈ 15:1). Regel: aldrig `var(--av-accent)` som textfärg inuti `.av-stage`; knappar på stage använder `bg-[var(--av-accent)] text-white` (6.7:1 OK).
- **Etikett/bottler.** Inga nya klasser exponerar pris eller `kr`; ytorna får bara `--av-t`, `.av-card-lift` och `.av-soft-focus`.
- **Dashboards** behåller `--av-t 220ms`; `--av-t-slow` används enbart via `.av-reveal--public`, `.av-card-lift` och publika hero-ytor.

## Acceptanskriterier

- `rg -n "av-animate-" src/app/globals.css` visar att varje `av-animate-*`-klass matchas av `[class*="av-animate-"]` i reduce-blocket; manuell test med "Reduce motion" i macOS: inga rörelser på `/`, `/produkter`, `/konto`.
- `rg -in "f5a623|de3163|cerise|orange" src` → 0 träffar.
- `rg -n "#[0-9a-fA-F]{3,8}\b" src --glob '!src/app/styles/tokens.css' --glob '!src/ui/studio/engine/**'` → 0 träffar; inuti `tokens.css` finns hex bara i `:root`.
- `rg -n "av-lift\b" src` → 0 träffar (allt är `av-card-lift`); `rg -n "\.av-marquee\s*\{" src` → 0 (bara `.av-marquee-track` animerar).
- `curl -s localhost:3000/ | rg -c 'class="[^"]*av-reveal'` > 0 **och** sidan visar text med JS avstängt (DevTools → Disable JavaScript).
- `rg -n "lucide|framer|gsap" package.json` → 0 träffar; `git diff --stat package.json` tom.
- `npx tsc --noEmit` och `next build` gröna; `Reveal` accepterar `variant="public"`, `Button`/`LinkButton` accepterar `shape="pill"`.
- Header på `/` är transparent vid `scrollY = 0` och har `data-scrolled="true"` efter 24 px; på `/konto` finns ingen `.av-site-header`.
- Kontrastmätning (DevTools Accessibility eller `polypane`/`axe`) på `.av-stage`: all text ≥ 4.5:1.
- Visuell diff-runda (före/efter-skärmdumpar, 1440 och 390 px) på fem sidor: `/`, `/produkter/profilvatten`, `/kassa`, `/konto`, `/operations`. Godkänt när enda skillnaderna är radier på hero-CTA, lyftdjup och reveal-tempo.

## Beroenden

- Uppåt: **inga**. Ändringarna är rent additiva CSS/TSX-primitiver plus en konsolidering av `.av-lift`.
- Nedåt: **04** (publik startsida — parallax, stage, header, marquee, `FeatureChip`, `Faq`), **02** (produktsidor — `.av-card-lift`, `.av-soft-focus`), **03** (kassa-modal — `.av-peek` med `--av-radius-xl`/`--av-shadow-pop`, `shape="pill"`), **06** (dashboards — `Reveal variant="dash"`, `av-soft-focus` på kontroller) bygger alla på denna fil och ska inte definiera egna keyframes eller skuggor.
- Rör inte `Skyltochgravyr/skyltmotor/`.

## Uppskattad storlek

- `tokens.css`: +8 tokens, +~90 rader klasser, −10 rader `.av-lift`, 5 hex-byten.
- `globals.css`: rad 42–74 ersätts med ~60 rader.
- `layout.tsx`: +6 rader. `Reveal.tsx`: omskrivning ~50 rader. `primitives.tsx`: +~25 rader (`shape`, `FeatureChip`, `av-soft-focus`). `PageIntro.tsx`: 3 radändringar. Ny `Faq.tsx` ~25 rader, ny `Parallax.tsx` ~55 rader.
- 11 `av-lift`-byten i `.tsx`, 8 publika sidor får `variant="public"`.
- Cirka **en arbetsdag** inklusive visuell diff-runda och reduce-motion-test; ingen datamodell, ingen deploy-grind utöver av-bug-hunter-prepush.
