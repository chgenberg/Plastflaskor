# 07 — Kundportal: hem och orderhub

Äger: `/konto` (hem), `/konto/ordrar` (lista), orderhubben i peeken (`BuyerOrderDetail` embedded) och
post-order-artworkflödet. Shell och det generiska kitet (`NeedsAttention`, `StatCard`, `QuickLinks`,
`StepIndicator`, `statusHint`) ägs av fil 06 och konsumeras här.

## Mål

Kunden som loggar in ska på under tre sekunder se **vad som behövs av hen** — artwork saknas, korrektur att
godkänna, orderbekräftelse på väg — innan något annat. Därefter ordrar (senaste 5, resten bakom "Visa alla"),
sedan snabbvägar: Beställ igen, Ladda upp artwork, Fakturor.

Orderhubben (peeken) ska svara på en enda fråga överst: *vad är nästa steg och vem gör det?* En primär åtgärd,
aldrig två. Kedjan kund → Aqua → artwork → korr → OB → etikett → bottler → frakt → faktura visas som tidslinje
med aktuell fas markerad.

Nyregistrerad kund som kommer från `/kassa/bekraftelse` med en första order utan artwork ska landa i ett
tillstånd där "Ladda upp artwork" är det enda som skriker.

## Vad BBB gör

Repo: `/Users/christophergenberg/Desktop/Billboardbee-2.0`.

**Hem** — `src/app/dashboard/page.tsx`
- `DashboardOverview` (r 56–80): `PageHeader` "Hej, {förnamn}" (r 65–68), rollväxel till `AdvertiserOverview` (r 76).
- `NeedsAttentionBox` (r 98–115): pastellröd panel "Kräver åtgärd", `<ul>` med länkade rader. Renderas bara om det
  finns konkreta, länkbara problem.
- `AdvertiserOverview` (r 353–508): 4× `StatCard` (r 437–462: Spelar idag · Bokat totalt · Est. kontakter · Nästa
  kampanjstart), `actions[]` (r 410–433: saknat material → `/dashboard/kampanj?bokningId=`, slutar snart → detalj,
  gamla utkast → lista), `NeedsAttentionBox` (r 464–481), `EmptyState` eller `RecentCampaigns` med
  `bookings.slice(0, 5)` (r 483–497), `QuickLinks` (r 498–505).
- `RecentCampaigns` (r 1090–1157): rubrik + "Visa alla", grid-lista med `Badge`/`statusLabel`. `QuickLinks` (r 1159–1173).

**Orderhub** — `src/app/dashboard/bokningar/[id]/page.tsx`
- `TIMELINE` (r 54–59) → horisontell stegrad med `aria-current="step"` (r 194–228), mobil "Steg N av M" (r 225–227).
- KPI-rad (r 232–258), åtgärdsrad (r 261–314): "Hantera material", "Granska & godkänn" (bara om ej aktiverad,
  r 267–271), PDF-länkar, Beställ igen, Avbryt.
- Rader (r 317–346), Material-sektion (r 349–381): tom-tillstånd "Inget material uppladdat ännu" → knapp, annars
  `MaterialReviewCard` + `BookingMaterialPreview` (r 373–378).

**Post-order-flöde**
- `src/components/steps.tsx` (r 6–10, 12–53): `StepIndicator` med `current: 2 | 3 | 4` och `alreadyActivated`.
- `src/app/dashboard/kampanj/page.tsx`: `?bokningId=` (r 141–142), `StepIndicator current={3}` (r 640, 659),
  tom-tillstånd "Ingen kampanj vald" (r 637–656), `MaterialPreview` + `MaterialReviewCard` i sticky aside
  (r 971–978), "Nästa" disabled tills granskning klar (r 980–990).
- `src/components/material-preview.tsx` (`MaterialPreview`, r 93); `src/components/dashboard/material-review-card.tsx`
  (`MaterialReviewCard`, r 7): godkänd/avvisad-banner med admin-notering.
- `src/app/dashboard/granska/page.tsx`: steg 4, `PATCH status: "active"` (r 154) — enda stället kunden själv aktiverar.
- `src/app/dashboard/material/page.tsx` (r 80–100): bibliotek med egen "Kräver åtgärd"-lista in i kampanjsteget.
- `src/components/ui/badge.tsx`: `campaignListFilter` (r 118–140) prioriterar `waiting_material` → `flagged` →
  `approved` före DB-status; `statusLabel` (r 165–190) ger "Väntar på material" / "Åtgärda material".

## Vad Aqua har idag

Repo: `/Users/christophergenberg/Desktop/Par_tryckeri`.

**Hem** — `src/app/(konto)/konto/page.tsx` (88 r)
- `requireRole` + `listOrdersForCustomer` (r 15–16). KPI:er räknas inline (r 18–21: aktiva, korr, på väg, fakturor).
- `NextStep` ovanför KPI:erna (r 32–38) driven av `buyerNextAction` (`src/domain/orderBrief.ts` r 111–141) — en
  enda "Vad behöver du göra nu?". Länkar till `/konto/ordrar/{orderNo}` som redirectar till peek.
- `KpiStrip`/`KpiCard` (r 41–46), `EmptyState` (r 49–56), `BuyerOrderTable` med `slice(0, 6)` (r 58–80),
  `KontoOrderPeek` via `?order=` (r 85). `BuyerOrderTable` bor i `src/ui/order/BuyerOrderCard.tsx` (r 16–60).

**Lista** — `src/app/(konto)/konto/ordrar/page.tsx` (75 r): `FilterChip` all/active/proof/shipped/delivered
(r 32–44), peek med `closeHref` som behåller `view` (r 17, 72). `[orderNo]/page.tsx` redirectar till
`/konto/ordrar?order=` (r 11).

**Peek** — `src/ui/order/OrderPeek.tsx` (`<dialog>`, `showModal`, stäng → `router.push(closeHref)`),
`KontoOrderPeek.tsx` (`kontoPeekHref`, `findKontoOrder`, r 5–18) wrappar `BuyerOrderDetail embedded`.

**Orderhub** — `src/ui/order/BuyerOrderDetail.tsx` (261 r)
- `StatusChip` + `BUYER_STATUS` (r 95), tidig `NextStep` för SUBMITTED/AQUA_REVIEW (r 96–102), leveranspanel (r 103–109).
- Korr: `needsProof`/`customerFinal` (r 80–81), `NextStep` (r 112–118), panel med förhandsvisa/ladda ner +
  `customerApproveProofAction` (r 119–133). Låst order → `OrderConfirmationPreview` + "Beställ igen" (r 135–162).
- `Timeline` med `buyerTimeline` (r 164–173; `orderBrief.ts` r 53–91: 7 kundsteg Order mottagen → Levererad).
- Artwork-panel bara när ej låst (r 175–195) med `ArtworkUpload` (`src/ui/shell/ArtworkUpload.tsx`, ren `<form>`
  mot `/api/artwork`). Pris (r 197–217, gated `canSeePrices` r 79), Faktura (r 219–233), Spårning, Dokument.

**Artwork** — `src/app/(konto)/konto/artwork/page.tsx` (54 r): tabell över designs, ingen "kräver åtgärd", ingen
orderkoppling för uppladdning. `/api/artwork/route.ts` (r 7–36) → `uploadArtworkForOrder` (`artwork.service.ts`
r 8–75, vägrar om `lockedAt`, r 23).

**Liknar redan:** peek som orderhub, `NextStep` som primär åtgärd, `buyerTimeline`, roll-gated priser, `returnTo`.

**Saknas:** rött "Kräver åtgärd" med flera rader; KPI:er som svarar på kundens frågor (inget belopp, inget datum);
"artwork saknas" som status (`BUYER_STATUS` r 41–58 säger bara "Mottagen — väntar på Aqua"); tidslinjen ligger
mitt i detaljen istället för överst; två åtgärder kan konkurrera (korr-knapp + upload-form); ingen `StepIndicator`
efter köp; ingen förhandsvisning av artwork; ingen e-post när OB skickas.

## Ändringar

### 1. `/konto` hem — `src/app/(konto)/konto/page.tsx`

Ordning: `PageHeader` → `NeedsAttention` → 4 KPI → senaste 5 → `QuickLinks`. `NextStep` tas bort från hemmet
(flyttar in i peeken som åtgärdspanel); `NeedsAttention` ersätter den.

KPI (kundens egna priser är tillåtna här, `canSeePrices("CUSTOMER")` är true):

```ts
const year = new Date().getFullYear();
const active = orders.filter((o) => !DONE.has(o.currentStatus)).length;
const waitingOnYou = orders.filter((o) => customerActionFor(o) !== null).length;
const nextDelivery = orders
  .map((o) => o.aquaApprovedDelivery ?? o.preliminaryDate)
  .filter((d): d is string => Boolean(d && d >= today))
  .sort()[0];
const spentThisYear = orders
  .filter((o) => o.lockedAt && o.createdAt.getFullYear() === year)
  .reduce((s, o) => s + orderValue(o), 0); // order.service.ts r 444
```

`KpiCard`: Aktiva ordrar (`/konto/ordrar?view=active`) · Väntar på dig (`/konto/ordrar?view=action`) · Nästa
leverans (datum eller "–") · Beställt i år (`formatSEK`, ex moms; bara låsta ordrar så snapshot är källan).

`customerActionFor(order)` läggs i `src/domain/orderBrief.ts` bredvid `buyerNextAction` och blir enda källan för
"väntar på dig":

```ts
export type CustomerAction = "artwork" | "proof" | "invoice";
export function customerActionFor(o: {
  currentStatus: string; lockedAt: Date | null;
  designs: { files: { id: string }[] }[];
  artworkApprovals?: { kind: string }[];
  invoice?: { status: string } | null;
}): CustomerAction | null {
  const hasArtwork = o.designs.some((d) => d.files.length > 0);
  if (!o.lockedAt && !hasArtwork && o.currentStatus !== "ARTWORK_CUSTOMER_APPROVAL") return "artwork";
  if (o.currentStatus === "ARTWORK_CUSTOMER_APPROVAL" &&
      !(o.artworkApprovals ?? []).some((a) => a.kind === "CUSTOMER_FINAL")) return "proof";
  if (o.currentStatus === "INVOICED" && o.invoice?.status !== "PAID") return "invoice";
  return null;
}
```

`NeedsAttention` (fil 06) får rader med länk **direkt in i peeken på rätt flik** via
`kontoPeekHref("/konto", o.orderNo, { steg })`:

| Åtgärd | Rubrik / detalj | Länk |
|---|---|---|
| `artwork` | "{orderNo} saknar artwork" · "Utan artwork kan vi inte skicka korrektur." | `?order=X&steg=artwork` |
| `proof` | "Korrektur väntar på ditt godkännande" | `?order=X&steg=korr` |
| `invoice` | "{invoiceNo} förfaller {dueAt}" | `/konto/fakturor?order=X` |

Max 5 rader, sorterade artwork → proof → invoice. Rutan renderas inte alls om listan är tom (BBB r 464).

Senaste ordrar: `orders.slice(0, 5)` (idag 6) + rubrik "Senaste ordrar" och "Visa alla" → `/konto/ordrar`.
`QuickLinks`: Beställ igen (senaste låsta order → `/konto/ordrar/{orderNo}/repeat`, annars `/konto/ordrar/ny`),
Ladda upp artwork (`/konto/artwork`), Fakturor (`/konto/fakturor`).

Tom-tillstånd för nyregistrerad kund (`src/app/(public)/kassa/bekraftelse/page.tsx` r 4–7 redirectar via
`homeForRole`): exakt en order i `SUBMITTED`/`AQUA_REVIEW` utan artwork, dvs
`orders.length === 1 && customerActionFor(orders[0]) === "artwork"`. Då visas ingen KPI-strip; istället
`NeedsAttention` med en rad + `StepIndicator` (Beställd ✓ → **Artwork** → Korr → OB) + `EmptyState` "Tack för din
order — nästa steg är artwork".

### 2. Orderlista — `src/app/(konto)/konto/ordrar/page.tsx`

- Ny vy `view=action` (r 14, 19–28): `all.filter((o) => customerActionFor(o))`. Chip "Väntar på dig" ersätter
  "Väntar på godkännande".
- `statusLabel` per rad byts från `BUYER_STATUS[o.currentStatus]` (r 60) till `statusHint(o)` (fil 06) som
  prioriterar "Artwork saknas" → "Godkänn korrektur" → "Väntar på OB" före DB-status — spegling av `campaignListFilter`.
- `kontoPeekHref` får `steg` vidare så `?order=X&steg=artwork` fungerar från listan också.

### 3. Orderhub — `src/ui/order/BuyerOrderDetail.tsx`

Ny ordning i `body` (r 90–258):

1. **Tidslinje överst** (flyttas från r 164–173). Horisontell `StepIndicator`-variant på desktop, vertikal
   `Timeline` på mobil. Steg: Beställd → Artwork → Korr → OB → Etikett → Produktion → Skickad → Levererad.
   `buyerTimeline` utökas med `artwork`- och `proof`-steg före `confirmed`; `current` sätts av `customerActionFor`
   när kunden äger steget.
2. **Åtgärdspanel** med **en** primär åtgärd:

```tsx
const action = customerActionFor(order);
const brief = orderBrief(order.currentStatus, order.requestedDate); // orderBrief.ts r 22
{action === "artwork" ? <NextStep title="Ladda upp artwork" body="Utan artwork kan vi inte skicka korrektur." tone="next" /> : null}
{action === "proof"   ? <NextStep title="Godkänn korrektur" body="Filen blir slutgiltig artwork till etikettproducenten." tone="next" /> : null}
{action === null && !order.lockedAt ? <NextStep title="Vi jobbar på din order" body={brief.waiting} tone="done" /> : null}
```

   `brief.waiting` ger "Aqua — skicka korrektur" etc. när det inte är kundens tur. Befintliga `NextStep`-block
   r 96–102 och r 112–118 tas bort.
3. Leveranspanel (r 103–109) oförändrad.
4. **Rader**: `VisualSpecCard` (r 110) + orderrader med qty och, för CUSTOMER, `unitPriceExVat` (flyttas upp från
   Pris-panelen r 197–217).
5. **Artwork & korrektur** med förhandsvisning — en panel som ersätter r 119–133 och r 175–195. Visar senaste
   `designs[].files[0]` som `<img>`/PDF-ikon via `/api/artwork-files/{id}`, `PROOF`-dokument via
   `/api/documents/{id}?inline=1`, och `ArtworkUpload` **bara** när `action === "artwork"` och `!lockedAt`.
   Godkänn-formuläret (`customerApproveProofAction`, `src/actions/index.ts` r 519–529) **bara** när
   `action === "proof"`. Aldrig båda.
6. Låst order → `OrderConfirmationPreview` (r 137–157), Faktura, Spårning, Dokument oförändrade.

Öppna på rätt flik: `KontoOrderPeek` (r 20–42) tar `steg?: "artwork" | "korr"` och skickar `scrollTo` till
`BuyerOrderDetail`, som sätter `id="steg-artwork"` / `id="steg-korr"` på panelen; `OrderPeek` scrollar dit i
`useEffect` efter `showModal()` (r 18–28).

### 4. Post-order artwork-steg

Ingång: `/konto/ordrar?order=X&steg=artwork` (primär, peek) och `/konto/artwork?order=X` (sekundär). Ingen ny route.

- `src/app/(konto)/konto/artwork/page.tsx`: ovanför tabellen en `NeedsAttention` med ordrar där
  `customerActionFor(o) === "artwork"` (som BBB material r 80–100), rad → `/konto/ordrar?order=X&steg=artwork`.
  När `?order=X` finns: `StepIndicator` (Beställd ✓ → **Artwork** → Korr → OB) + `ArtworkUpload orderId
  returnTo="/konto/ordrar?order=X"`.
- `StepIndicator` (fil 06) tar `steps: {id,label}[]` + `current` istället för BBB:s hårdkodade 2|3|4 (`steps.tsx` r 6–10).
- Efter upload redirectar `/api/artwork` till `returnTo` (r 31–34); peeken öppnas i "Aqua granskar"-läge.
- `ArtworkUpload.tsx`: `accept`-hjälptext, client-side storleksgräns, `aria-describedby` — men behåll ren `<form>`.

### 5. `statusHint` per status för kund

Input till fil 06:s `statusHint(order)`; ersätter `BUYER_STATUS` i portalen (Ops behåller `ORDER_STEP_LABELS`).

| Status | Villkor | Kundens etikett | Ton |
|---|---|---|---|
| SUBMITTED / AQUA_REVIEW | ingen artwork | Artwork saknas | next |
| SUBMITTED / AQUA_REVIEW | artwork finns | Aqua granskar | idle |
| ARTWORK_AQUA_REVIEW | – | Korrektur på väg | idle |
| ARTWORK_CUSTOMER_APPROVAL | ej CUSTOMER_FINAL | Godkänn korrektur | next |
| ARTWORK_CUSTOMER_APPROVAL | CUSTOMER_FINAL | Väntar på orderbekräftelse | idle |
| CONFIRMED … LABELS_DISPATCHED | – | Etiketter produceras | done |
| LABELS_RECEIVED … IN_PRODUCTION | – | Produktion | done |
| READY_TO_SHIP / SHIPPED | – | Förbereds för leverans / Skickad | done |
| DELIVERED / READY_TO_INVOICE | – | Levererad | done |
| INVOICED | ej PAID | Faktura att betala | next |
| PAID | – | Klar | done |

### 6. E-post-triggers som redan finns

`src/server/integrations/types.ts` r 36–39; mock i `src/server/integrations/adapters/mock/index.ts`:
- `sendOrderConfirmation` (r 163) — vid `createBuyerOrder` (`order.service.ts` r 332), "Order mottagen … OB inom 24 h".
- `sendArtworkApproval` (r 184) — vid `sendProof` (`artwork.service.ts` r 103), "Korrektur att godkänna".
- `sendDeliveryNotice` (r 203) — vid `confirmDelivery` (`artwork.service.ts` r 138). `sendRepeatReminder` (r 222).

Saknas, läggs till av fil 06/09 (ej här): mejl när OB låses (`sendOrderConfirmation` i `order.service.ts`
r 388–443 skapar dokument men mejlar inte) och påminnelse "artwork saknas" efter 48 h. Länkarna i mejlen pekar
på `/konto/ordrar?order=X&steg=…`.

## Kontraktskontroll

- **Egen prislista.** Alla siffror på `/konto` kommer från `listOrdersForCustomer(customerId)` (`order.service.ts`
  r 45–51, filtrerar `buyerType: "CUSTOMER"`). "Beställt i år" summerar `orderValue()` på kundens egna låsta ordrar —
  snapshoten är redan räknad mot kundens prislista. Ingen `priceList`-lookup i UI.
- **Snapshot orörd.** Hubben läser `priceSnapshotJson`; inga writes. `uploadArtworkForOrder` vägrar när `lockedAt`
  (r 23) — oförändrat.
- **OB/irreversible aldrig av automation.** `customerApproveProof` (`artwork.service.ts` r 110–125) sätter bara
  `CUSTOMER_FINAL`, går inte till CONFIRMED. `sendOrderConfirmation` (låser) körs enbart av Aqua i Ops. Ingen
  knapp autoklickas; ingen server action i denna fil ändrar `currentStatus`.
- **Etikett/bottler ser inte kr.** Ingen ändring på `/labels`, `/bottler`; `canSeePrices`
  (`src/domain/policies/priceVisibility.ts` r 4–6) gatar fortfarande varje kr i `BuyerOrderDetail`.
- **"Agenten" i text.** Raden "Agenten bevakar kedjan…" (r 94) behålls; inga modellnamn.
- **Åtkomst.** Peek hittar order via `findKontoOrder` i kundens egen lista; `[orderNo]/page.tsx` r 10 fortsätter
  `notFound()` på fel `customerId`.

## Acceptanskriterier

1. Kund med en order utan artwork ser på `/konto` exakt en röd rad "{orderNo} saknar artwork"; klick öppnar peek
   med artwork-panelen i viewport och upload-formuläret synligt; ingen "Godkänn korrektur"-knapp.
2. Efter upload: redirect tillbaka till samma peek, raden borta från `NeedsAttention`, status "Aqua granskar".
3. Order i `ARTWORK_CUSTOMER_APPROVAL` utan `CUSTOMER_FINAL`: hubben visar "Godkänn korrektur" som enda primära
   åtgärd och **inget** upload-formulär. Efter godkännande: etikett "Väntar på orderbekräftelse", `currentStatus`
   fortfarande `ARTWORK_CUSTOMER_APPROVAL`, `lockedAt` null.
4. "Väntar på dig" = antal ordrar där `customerActionFor !== null`; `/konto/ordrar?view=action` listar exakt dem.
5. "Beställt i år" = summan av `orderValue()` för kundens låsta ordrar skapade i år; ändras inte om Aqua byter
   prislista efter låsning.
6. Nyregistrerad kund (1 order, ingen artwork): ingen KPI-strip, `StepIndicator` med Artwork markerad, en rad.
7. Kund utan ordrar: `EmptyState` med "Ny order"-knapp, inga KPI:er, ingen `NeedsAttention`.
8. Inloggad som AQUA_ADMIN på `/konto` (utan `customerId`): renderar utan krasch och utan kundpriser (`orders = []`).
9. Tidslinjen visar aktuell fas med `aria-current="step"`; mobil visar "Steg N av 8".
10. `rg "kr" src/app/\(labels\) src/app/\(bottler\)` oförändrad mot HEAD.
11. Hemmet gör en (1) DB-fråga för ordrar; inga N+1 per KPI.

## Beroenden

- **01** (kassa + registrering): `/kassa/bekraftelse` måste sätta `customerId` på sessionen innan redirect,
  annars landar kunden i admin-tomtillståndet (`konto/page.tsx` r 50–55).
- **03** ("ladda upp senare"): ordern måste kunna skapas utan `designs[]`, annars blir
  `customerActionFor === "artwork"` aldrig sant.
- **06** (shell + kit): `NeedsAttention`, `StatCard`/`KpiCard` med hint, `QuickLinks`, generisk `StepIndicator`,
  `statusHint`. Tabellen i §5 är input till `statusHint`.
- Läser men rör inte: `order.service.ts`, `artwork.service.ts`, `/api/artwork`, `prisma/schema.prisma`.

## Uppskattad storlek

- `orderBrief.ts`: `customerActionFor` + utökad `buyerTimeline` — ~60 r.
- `konto/page.tsx`: omskrivning — ~120 r (från 88). `konto/ordrar/page.tsx`: ~15 r.
- `BuyerOrderDetail.tsx`: omordning + artwork/korr-panel — ~90 r netto.
- `KontoOrderPeek.tsx` + `OrderPeek.tsx`: `steg`/scroll — ~20 r. `konto/artwork/page.tsx`: ~40 r. `ArtworkUpload.tsx`: ~10 r.

Totalt ~350 rader ändrad kod, 0 nya routes, 0 schemaändringar, 0 nya server actions. En arbetsdag inklusive
verifiering mot kriterierna ovan, givet att fil 06:s kit finns.
