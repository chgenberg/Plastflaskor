# 02 · Produktsidan som kassa

Förebild: Billboardbee 2.0 (`/Users/christophergenberg/Desktop/Billboardbee-2.0`, "BBB").
Mål: Aqua Visibility OS (`/Users/christophergenberg/Desktop/Par_tryckeri`, "Aqua").
Den här filen äger **produktsidans layout och konfigurationspanelen**.
Fil 01 äger server-actions och routing. Fil 03 äger kassa-modalen.

## Mål

Produktsidan blir skärm 1–2 av max fyra i köpflödet.
Allt kunden väljer sitter i en sticky panel på samma sida:

- Variant/volym (33 cl, 50 cl, Stenkulla …).
- Antal, med MOQ som default och golv.
- Stilla/kolsyrat, om katalogen har båda för vald volym.
- Kork och flaskfärg, om katalogen har alternativ.
- Artwork nu (till studion) eller senare.

Panelen visar **inga `kr` för anonym**. Texten är "Pris visas när du skapar konto".
Inloggad kund ser pris räknat på servern.
CTA heter **"Beställ"** och öppnar kassa-modalen (fil 03).
På mobil ligger en sticky bar längst ner som scrollar till panelen.
Listsidorna får kort som är rena länkar. Ingen kundvagn.

## Vad BBB gör

Detaljsidan är enda kassan. Kort i listan är länkar. Allt annat sker på `/skylt/[slug]`.

**`src/app/skylt/[slug]/page.tsx`** — sektionsordning:

1. Tillbaka-länk: `<BackLink />` (rad 216).
2. Hero-bild: `h-[240px] … rounded-3xl … sm:h-[340px]` (rad 219) med typ-badge överst till vänster (rad 248–254).
3. Titelrad: eyebrow med accentpunkt + stad (rad 260–263), `h1` (rad 265), "från X kr" till höger (rad 275–311).
4. Två kolumner: `lg:grid-cols-[1fr_400px] lg:items-start` (rad 314).
5. Vänster: "Om skylten" (rad 317–322), spec-`<dl>` i 2–3 kolumner (rad 324–351), regler i `<details>` (rad 356–378), karta (rad 398–410).
6. Höger: `id="boka" className="scroll-mt-20 lg:sticky lg:top-24"` (rad 415) som wrappar `SignBookingPanel` (rad 417–438).
7. Mobil sticky bar: `safe-pb fixed inset-x-0 bottom-0 z-50 … lg:hidden` (rad 461) med pris + `<a href="#boka">` (rad 498–503).
8. `<main>` har `pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0` så baren inte täcker innehåll (rad 203).

**`src/components/sign/sign-booking.tsx`** — panelen:

- Kontraktet står i headern: servern repriserar allt, panelen förhandsvisar bara (rad 3–8).
- Period-chips (rad 343–367), datumfält (rad 368–396), SoV-slider (rad 415–447).
- Material: rubrik "Ditt material (valfritt, kan laddas upp senare)" (rad 452–457) och `MaterialSection` (rad 458–473).
- Prisblock med hairline (rad 477–538), `BookingTrust` (rad 540), knapp "Boka nu" (rad 544–552).
- Knappen öppnar `BookingModal` (rad 564–573). Bokningen går via `fetch("/api/agent")` (rad 226–250).

**`src/components/sign/booking-trust.tsx`** — tre trygghetspunkter i en `Disclosure` (rad 12–16, 21).

**`src/components/agent/material-section.tsx`** — `MaterialSection({ signs, assets, onAssetsChange, onReviewingChange })` (rad 71–83).

**`src/components/skyltar/skyltar-client.tsx`** — kort är `<Link href={card.href}>` (rad 451–454). Headern säger det rakt ut: "cards are plain links, no multi-select" (rad 5–7).

**`src/components/cards.tsx`** — `SignCard` har en plus-knapp, men den gör `router.push('/skylt/…')` (rad 53–56). Ingen cart.

**`src/lib/skyltar-cards.ts`** — `SkyltCard.href` är detaljsidan (rad 30–31), satt till `/skylt/${s.slug}` (rad 203).

## Vad Aqua har idag

**`src/app/(public)/produkter/[category]/[product]/page.tsx`**

- Hämtar `getPublicProductBySlug` och `canSeePrices(user?.role)` (rad 14–17).
- Tar bara `variants[0]` (rad 18) och bygger `productFacts` (rad 19–27).
- `PublicPage narrow` (rad 39) → en kolumn, max 48 rem.
- Hero `av-media aspect-[4/5]` under titeln (rad 46–49).
- `<dl class="av-card">` med fakta (rad 51–58), sedan `<pre>` med `specText` (rad 59–61).
- CTA-block (rad 62–76): "Logga in och beställ"/"Beställ i kundportalen" (rad 63–66), "Begär offert" (rad 68–70), "Logga in för priser" (rad 71–75).
- Brödtext sist (rad 77–81).

Saknas: konfiguration, antal, sticky panel, mobil bar, trust-rad, "Så går det till". Kunden skickas bort från sidan för att beställa.

**`src/app/(public)/produkter/page.tsx`** — kategorikort är redan `<Link>` (rad 41). OK.

**`src/app/(public)/produkter/[category]/page.tsx`** — `<article>` med bild-länk (rad 64–66), "Läs mer →" (rad 72–74) och "Logga in och beställ" → `/login?next=/konto/ordrar/ny` (rad 75–77). Två CTA per kort. Ingen cart, men fel mål.

**`src/server/services/catalog.service.ts`**

- `listWaterProducts` inkluderar `variants` + `printRequirements` (rad 28–34).
- `getPublicProductBySlug` inkluderar bara `variants` (rad 43–48). `printRequirements` saknas.
- `getPriceListForBuyer` faller tillbaka på `STANDARD` (rad 50–78). `resolveUnitPrice` väljer tier (rad 80–88).
- `assertCanSeePrices` (rad 149–153). `publicProductDto` strippar variants till id/sku/name/volym/pack/options (rad 155–169).

**`src/ui/order/BottleOrderForm.tsx`** (bakom login, `/konto/ordrar/ny`)

- Fälten finns: storlek, stilla/kolsyrat, kapsyl, färg (rad 115–160), antal med `min={moq}` (rad 170–181), artwork "Valfritt. Ni kan också ladda upp efter…" (rad 243–249).
- Men priset räknas **i klienten** från tiers som skickats ner (`unitFor`, rad 23–27; visning rad 182–191). Det bryter "pris räknas på servern" och kan inte återanvändas publikt.
- `matchVariant` (rad 33–45) är bra och lyfts ut.
- Sidan bygger variantlistan i `src/app/(konto)/konto/ordrar/ny/page.tsx` (rad 25–44) med `requireRole` (rad 10).

**`src/app/(studio)/designa/[product]/page.tsx`** + **`src/ui/studio/Studio.tsx`** — studion skickar till `/konto/ordrar/ny?design=${design.id}` (Studio rad 165). Bakom login.

**`src/domain/policies/priceVisibility.ts`** — `canSeePrices` = CUSTOMER eller Aqua-admin (rad 4–6). `stripPrices` (rad 16–24).

**`src/domain/bottleCatalog.ts`** — `bottleOptionsSchema` (rad 3–7), `parseBottleOptions` (rad 11–31), etiketter för vatten/kork/färg (rad 33–48).

**`src/domain/schemas.ts`** — `buyerOrderSchema` (rad 14–30) tar `variantId, qty, waterType, cap, color, designId`. Det är redan formen för panelens state.

**`src/app/(public)/kassa/page.tsx`** — redirectar till login/hem (rad 1–7). Död route i dag. Fil 01/03 bestämmer om den tas bort.

Seed-data (`prisma/seed.ts`): varianter bär `waterType` i `optionsJson` (rad 112–113, 139–140, 162–164). Kork/färg finns bara som text i `specText`. Kork och färg är därför **orderfält**, inte variant-nycklar.

## Ändringar

### Ny: `src/ui/product/ProductConfigurator.tsx` (client)

Sticky panel. Ersätter CTA-blocket. Får `product`, `variants` (via `publicProductDto`), `canSeePrices`, `designId?`.

```tsx
export type ProductSelection = {
  productId: string;
  variantId: string;
  qty: number;
  options: { waterType: "stilla" | "kolsyrat"; cap?: string; color?: string };
  designId?: string;
};
```

- Volym som chips (som BBB period-chips). Stilla/kolsyrat som chips om `types.length > 1`. Kork/färg som `<select className={controlClass}>` om fler än ett alternativ.
- Antal: `<input type="number" min={moq} step={packSize}>` med default `moq`. Under fältet: "Minst {moq} st".
- `matchVariant` och `unique` flyttas till `src/domain/bottleVariants.ts` och importeras av både panelen och `BottleOrderForm`.
- Artwork: två radioknappar. "Designa nu" → länk till `/designa/{slug}` med `?next=` tillbaka. "Skicka senare" → `designId` lämnas tom. Ingen filuppladdning i panelen; det sker i modalen eller portalen.
- Pris: om `canSeePrices` är falskt renderas `<p>Pris visas när du skapar konto</p>`. Inga siffror. Om sant: `useEffect` med debounce 300 ms anropar `previewPriceAction(selection)` och visar `unitPriceExVat`, `lineExVat`, "exkl. moms". Vid `null`: "Kontakta oss för pris vid detta antal."
- Trust-rad: `<details>` "Trygg beställning" med tre punkter (ingen betalning nu, Aqua bekräftar leveransdatum, artwork kan skickas senare). Egen liten komponent i samma fil.
- CTA: `<Button size="lg">Beställ</Button>` → `onOrder(selection)`. Sidan äger modalen och skickar `selection` vidare (fil 03).

```tsx
<Button size="lg" className="w-full" disabled={!selection.variantId || qty < moq}
  onClick={() => onOrder(selection)}>
  Beställ
</Button>
```

### Ny: `src/ui/product/ProductStickyBar.tsx` (client)

Mobil bar, `fixed inset-x-0 bottom-0 z-40 lg:hidden`, `pb-[env(safe-area-inset-bottom)]`, `bg-[var(--av-surface)]/95 backdrop-blur-md`, hairline upptill.
Vänster: produktnamn + vald volym. Höger: `<a href="#bestall">` med knappstil "Beställ".
Ingen prisvisning i baren, oavsett roll. Sidans `<main>` får `pb-24 lg:pb-0`.

### Ombyggd: `src/app/(public)/produkter/[category]/[product]/page.tsx`

Byt `PublicPage narrow` → `PublicPage` (72 rem). Ny sektionsordning:

1. Tillbaka-länk till `/produkter/{category}` (`text-sm` + `→`-tecken, ingen ny komponent).
2. Hero: `av-media` med `aspect-[16/9] sm:aspect-[21/9]`, `<Badge>` från `PageIntro.tsx` (rad 5) absolut-positionerad överst till vänster med kategorinamn.
3. Titelrad: `av-label` eyebrow med kategori, `PageIntro title`, `oneLiner`. Inget pris här.
4. Grid `lg:grid-cols-[1fr_400px] lg:items-start gap-8`.
5. Vänster: "Om produkten" (`body`), spec-`<dl>` från `productFacts` för **alla** varianter (volym-lista i stället för `variants[0]`) plus `printRequirements` som lista "Etiketten måste innehålla", "Så går det till" (`<ol>` med fyra steg: välj → skapa konto → artwork → OB och leverans), `specText` i `<details>` "Teknisk specifikation".
6. Höger: `<div id="bestall" className="scroll-mt-20 lg:sticky lg:top-24">` med `ProductConfigurator`. Headern är 64 px (`PublicNav.tsx` rad 86–87), så `top-24` räcker.
7. `ProductStickyBar` sist.

Servern hämtar `getProductBySlug` (har `printRequirements`) i stället för `getPublicProductBySlug`, filtrerar `isPublic` själv, och skickar `publicProductDto(item)` till panelen. `canSeePrices(user?.role)` skickas som boolean. Studion är låst för icke-profilvatten, så panelen renderas bara om `category === "WATER"`; övriga kategorier behåller "Begär offert".

JSON-LD (rad 29–36) behålls utan `offers`.

### Listsidor

`src/app/(public)/produkter/[category]/page.tsx` (rad 62–80): hela `<article>` blir ett `<Link className="av-card av-lift …">`. "Logga in och beställ" (rad 75–77) tas bort. En CTA-text: "Konfigurera →". `src/app/(public)/produkter/page.tsx` är redan rätt.

### Server action `previewPriceAction` (fil 01 äger)

Den här filen behöver signaturen. Fil 01 placerar och implementerar.

```ts
export async function previewPriceAction(input: {
  variantId: string; qty: number;
}): Promise<{ unitPriceExVat: number; lineExVat: number } | null> {
  const user = await getSessionUser();
  assertCanSeePrices(user?.role);            // catalog.service.ts rad 149
  if (!user?.customerId) return null;
  const list = await getPriceListForBuyer({ customerId: user.customerId, variantId: input.variantId });
  const hit = resolveUnitPrice(list?.items ?? [], input.variantId, input.qty);
  return hit ? { unitPriceExVat: hit.unitPriceExVat, lineExVat: Math.round(hit.unitPriceExVat * input.qty * 100) / 100 } : null;
}
```

Samma väg som `order.service.ts` `resolvePrice` (rad 157–162). Kundens prislista styr. Aldrig en tier-array till klienten.

### Gränser

- **Mot 01:** `previewPriceAction`, eventuell `/registrera`, `homeForRole`, vad som händer med `/kassa`. Panelen anropar bara actions, den definierar dem inte.
- **Mot 03:** modalen. Panelen levererar `ProductSelection`. Modalen äger registrering, adress, leveransönskemål, artwork-uppladdning och `placeBuyerOrderAction`. `BottleOrderForm.tsx` blir efter detta bara portalens "Ny order"-form och kan tunnas ut.
- **Mot 01/07:** vad som händer efter order (bekräftelsesidan ägs av 01, portalen av 07). Inte den här filen. 05 äger bara CSS-klasserna panelen använder.

## Kontraktskontroll

- **Inga `kr` i HTML för anonym.** Panelen får `canSeePrices=false` och renderar aldrig ett prisblock. `previewPriceAction` anropas inte alls. Testa med `curl` mot sidan utloggad och `grep -c " kr"` → 0.
- **Pris bara från servern.** Inga tiers, `unitPriceExVat` eller prislistor i props till klientkomponenter. `publicProductDto` (rad 155–169) är enda DTO:n. `unitFor` i `BottleOrderForm` (rad 23–27) får inte kopieras.
- **`canSeePrices`** gäller både i sidan (prop) och i actionen (`assertCanSeePrices`). Dubbel grind.
- **Prislista blandas inte.** Actionen använder `getPriceListForBuyer` med `user.customerId`. Ny kund får `STANDARD` via fallbacken (rad 67–69).
- **Ordersnapshot** rörs inte. Panelen skapar ingen order.
- **"agenten"**, aldrig AI, i all text på sidan. Studio-länken heter "Designa nu", inte "AI-design".
- **Etikett/bottler** ser inte sidan. Inget att strippa.

## Acceptanskriterier

1. Utloggad `GET /produkter/profilvatten/<slug>` innehåller inte strängen ` kr`, `unitPriceExVat` eller `minQty` i HTML.
2. Utloggad ser panelen med volym, antal (default = `moq`), stilla/kolsyrat, artwork-val, "Pris visas när du skapar konto" och knappen "Beställ".
3. Inloggad CUSTOMER ser pris i panelen inom 500 ms efter ändrat antal. Priset matchar `resolveUnitPrice` för kundens prislista vid samma `variantId`/`qty`.
4. Kund utan prislista får `STANDARD`-pris. Kund med Partner-lista får Partner-pris. Aldrig båda.
5. Antal under MOQ blockerar "Beställ" och visar "Minst {moq} st".
6. Klick på "Beställ" öppnar modalen med exakt `ProductSelection` (variantId, qty, options, designId?). Inga andra fält.
7. På viewport ≤ 1023 px syns sticky bar. Klick på "Beställ" i baren scrollar till `#bestall`. Baren visar inte pris.
8. På ≥ 1024 px är panelen `sticky top-24` och hamnar aldrig under headern.
9. Kort på `/produkter/[category]` är en enda länk till produktsidan. Ingen "Logga in och beställ".
10. Spec-`<dl>` listar alla volymer och `printRequirements`. Ingen `<pre>` synlig utan att öppna `<details>`.
11. Produkter som inte är `WATER` visar "Begär offert" i panelens plats, ingen konfigurator.
12. `npm run build` och befintliga tester (`catalog.service.test.ts`) passerar.

## Beroenden

- **01** — `previewPriceAction` i `src/actions/checkout.ts`; `/kassa` blir helsida (ingen separat `/registrera`). Panelen kan byggas med en stubbad action som returnerar `null`.
- **03** — kassa-modalen och dess prop-kontrakt (`ProductSelection`). Panelen kan mergas före 03 med `onOrder` som tills vidare navigerar till `/kassa?variant=…&qty=…`.
- **05** — `.av-card-lift`, `.av-soft-focus`, `controlClass`. Ingen blockering; panelen fungerar med dagens tokens.

## Uppskattad storlek

| Delmoment | Storlek |
| --- | --- |
| `src/domain/bottleVariants.ts` (flytta `matchVariant`/`unique`) | S |
| `ProductConfigurator.tsx` inkl. trust-rad och prisvisning | M |
| `ProductStickyBar.tsx` | S |
| Ombyggd `[product]/page.tsx` (grid, hero, dl, "Så går det till") | M |
| Listsidor: kort som länk, ta bort dubbel CTA | S |
| `previewPriceAction` (01 äger, här bara koppling) | S |
| Tester: HTML utan `kr` för anonym, MOQ-golv, prislista per kund | S |

Totalt: **M**. Två till tre arbetsdagar med 01 stubbad.
