# 08 · Rollhem: Operations, Etiketter, Bottler

Förebild: Billboardbee 2.0 (`/Users/christophergenberg/Desktop/Billboardbee-2.0`, "BBB").
Mål: Aqua Visibility OS (`/Users/christophergenberg/Desktop/Par_tryckeri`, "Aqua").
Den här filen äger **de tre rollhemmen** (`/operations`, `/labels`, `/bottler`) och
**deras granskningsköer**. Fil 06 äger shellen och det generiska kitet
(`NeedsAttention`, `StatCard`, `QuickLinks`, `statusHint`). Fil 01 äger
självregistrering och server-actions för nya kunder.

## Mål

Ops, etikettproducent och bottler öppnar sin startsida och ser inom två sekunder
vad som väntar på **just dem**. Varje rad har **en** primär åtgärd. Ordningen är
alltid: fyra KPI → "Kräver åtgärd" → lista → snabblänkar.

Nytt köpflöde (01–03) betyder att kunder registrerar sig själva och lägger order
utan att ops känner dem. `/operations` måste lyfta två köer som inte finns idag:
**Nya kunder att granska** och **Ordrar att bekräfta**.

Etikett och bottler ser aldrig `kr`, pris, faktura eller prislista. Det är redan
så i koden och ska förbli grep-bart.

## Vad BBB gör

**`src/app/dashboard/page.tsx`** (1173 rader) — ett rollhem per roll, vald i
`DashboardOverview` rad 69–77.

- `AdminOverview` rad 143–336: fyra `StatCard` (rad 209–236) → `NeedsAttentionBox`
  med de fem äldsta `PENDING_APPROVAL`-skyltarna, varje rad länkar till
  `/dashboard/admin/skyltar` (rad 239–270) → "Senaste bokningar" med `Badge` +
  `statusLabel` (rad 272–325) → `QuickLinks` (rad 327–333).
- `OwnerOverview` rad 729–1088: fyra `StatCard` (rad 933–958) → `StatusInfoBox`
  "Nya bokningar" (lugn, ingen åtgärd; rad 960–980) → `StatusInfoBox` "Status"
  (rad 982–1007) → `NeedsAttentionBox` för saknad bild/pris och synkfel (rad
  1009–1026) → bokningslista (rad 1028–1077) → `QuickLinks` (rad 1079–1085).
- `NeedsAttentionBox` rad 98–115 (pastellröd, renderas bara när det finns
  länkbara problem), `StatusInfoBox` rad 118–135, `QuickLinks` rad 1159–1173.

**Granskningskö.** `src/app/dashboard/admin/skyltar/page.tsx` (16 rader) är
rollgrind + `<AdminSkyltkoClient />`. Kön ligger i
`src/components/dashboard/admin-skyltko-client.tsx`: `decide(signId, "approve" |
"reject")` rad 58, knapparna Neka/Godkänn rad 132–139.
`src/components/dashboard/material-review-card.tsx` (obs: under `dashboard/`)
visar admins beslut: `adminDecision === "approved"` → banner med `adminNote`;
`"rejected"` → röd banner med notering (rad 16–33). Typerna i
`src/lib/material-review-types.ts` rad 11–12. Renderas i
`src/app/dashboard/granska/page.tsx` rad 301. `src/components/reviewer/reviewer-shell.tsx`
(`ReviewerShell` rad 8) är en egen shell för externa granskare.

**Status med nästa steg.** `src/components/ui/badge.tsx`: `StatusHint` rad 57–61,
`hintFromBooking` rad 79–93, `campaignListFilter` rad 118–140, `statusLabel` rad
165–190 ger "Väntar på material" / "Åtgärda material" i stället för DB-status.

**Kit.** `src/components/dashboard/ui.tsx`: `LIST_*` rad 1–90, `StatCard` rad 151–174.

**Kopieras inte.** `src/app/dashboard/intakter/page.tsx` visar ägarens `kr`;
ägare i BBB motsvarar leverantör i Aqua och får ingen motsvarighet. Inte heller
`AgencyOverview` (rad 510–727), `formatSEK`-KPI:er i `OwnerOverview` (rad
946–957) eller seedade plattformssiffror i `AdminOverview` (rad 225–236).

## Vad Aqua har idag

**`/operations`** — `src/app/(operations)/operations/page.tsx` (84 rader). Fyra
`KpiCard` räknade per hus-fas (rad 16–25, 42–47: Etiketter · Bottler · Frakt ·
Faktura). "Kräver åtgärd" är `ActionList` + `ActionCard` från
`exceptionSummary(exceptionsFor(orders))` (rad 64–80). Reglerna i
`src/domain/exceptions.ts` rad 100–208; `review` (rad 101–106) fångar
`SUBMITTED`/`AQUA_REVIEW` → `/operations/ordrar?alert=review`, filtrerat via
`ordersWithAlert` i `ordrar/page.tsx` rad 63. Saknas: KPI för "att bekräfta" och
"nya kunder", rader per order/kund, senaste ordrar med statusHint, QuickLinks.

**Kundgranskning.** `src/app/(operations)/operations/kunder/page.tsx` listar
Företag · Prislista · Org.nr · Ordrar · Nästa lead (rad 43–49) via `listCustomers`
(`src/server/services/customer.service.ts` rad 8–27). `Customer` i
`prisma/schema.prisma` rad 168–185 har **inga** fält för `verifiedAt`, `source`
eller `createdAt`. Ingen flagga "ny, ej verifierad".

**Artwork i ops.** `src/app/(operations)/operations/ordrar/[orderNo]/page.tsx`:
`AQUA_REVIEW`-panel med checklista och "Acceptera order" (rad 67–116,
`opsAdvanceAction` i `src/actions/index.ts` rad 234–243). `ARTWORK_AQUA_REVIEW`
har bara "Skicka korrektur till kund" (rad 165–170 → `approveArtworkAction` rad
508–514 → `approveArtwork` i `src/server/services/artwork.service.ts` rad
106–108). **Ingen neka-väg, ingen notering.** `ArtworkApproval.note` finns i
schemat (rad 404) men skrivs aldrig från ops.

**`/labels` och `/bottler`** — `src/app/(labels)/labels/page.tsx` (28 rader) och
`src/app/(bottler)/bottler/page.tsx` (27 rader): `requireSupplier` +
`listJobsForFactory` + `<SupplierDesk kind=…>`. `src/ui/supplier/SupplierDesk.tsx`
(208 rader) har redan `jobVisible` per roll (rad 14–27), rubrik "Vad behöver du
göra nu?" med undertext "ingen pris- eller fakturainformation" (rad 79–81),
etikett-KPI Nästa skickdatum · Leveransrapport (rad 90–104), bottler-`ActionCard`
"Etiketter att ta emot" (rad 105–124), `LabelJobsTable` (217 rader) och
`BottlerJobsTable` (122 rader, lane via `src/domain/bottlerDesk.ts` rad 2–10).
Prisfri data garanteras på servern: `factoryOrder`-selectet i
`src/server/services/production.service.ts` rad 19–62 tar aldrig med
`unitPriceExVat`, `priceSnapshotJson`, `invoice` eller `priceList`.
Saknas: fyra åtgärds-KPI, `NeedsAttention`-rader, primär knapp per jobbrad,
statusHint för leverantörsroller.

## Ändringar

### `src/app/(operations)/operations/page.tsx` — nytt ops-hem

Behåll datainhämtningen. Byt KPI från fas till åtgärd. Kit från fil 06
importeras från `@/ui/shell/primitives`.

```tsx
const kpi = {
  confirm: orders.filter((o) => ["SUBMITTED", "AQUA_REVIEW"].includes(o.currentStatus)).length,
  newCustomers: await countUnverifiedCustomers(),          // customer.service, nytt
  inProduction: orders.filter((o) => PRODUCTION_STATUSES.has(o.currentStatus)).length,
  toInvoice: orders.filter((o) => ["DELIVERED", "READY_TO_INVOICE"].includes(o.currentStatus)).length,
};
<KpiStrip>
  <KpiCard href="/operations/ordrar?alert=review" label="Att bekräfta" value={kpi.confirm} />
  <KpiCard href="/operations/kunder?filter=ny" label="Nya kunder" value={kpi.newCustomers} />
  <KpiCard href="/operations/produktion" label="I produktion" value={kpi.inProduction} />
  <KpiCard href="/operations/ekonomi" label="Att fakturera" value={kpi.toInvoice} />
</KpiStrip>
```

`PRODUCTION_STATUSES` = `ORDER_LIST_LANES[production].statuses` i
`src/domain/enums.ts` rad 111–122, ingen ny lista.

**`NeedsAttention`** ersätter `ActionList` men behåller `exceptionSummary` som
källa. Skillnad: de fem äldsta orderna per regel blir egna rader med länk till
`/operations/ordrar/[orderNo]` (som BBB rad 241–257), och två nya rader läggs
först: "N nya kunder att verifiera" → `/operations/kunder?filter=ny` och "N ordrar
från overifierad kund" → `/operations/ordrar?alert=review&kund=ny`
(`orderInclude` har redan `customer`, `order.service.ts` rad 31).

**Senaste 10 ordrar**: återanvänd `OrderResultsTable`
(`src/ui/ops/OrderResultsTable.tsx` rad 50) med `orders.slice(0, 10)`; byt
`StatusChip`-etiketten (rad 93–97) till `statusHint(order)` från fil 06. Ops får
se `kr` (rad 113). **QuickLinks**: Ordermottagning · Kunder · Agenten. Raden med
`agentOpen` och "Leverantörsunderlag" (rad 49–62) flyttar under QuickLinks.

### Kundverifiering — schema + `/operations/kunder`

Lägg till i `prisma/schema.prisma` efter rad 176:

```prisma
  source      String    @default("ops")   // "ops" | "self_signup"
  verifiedAt  DateTime?
  verifiedBy  String?
  createdAt   DateTime  @default(now())
```

Fil 01 sätter `source: "self_signup"` och lämnar `verifiedAt = null`;
`createDirectCustomer` (`customer.service.ts` rad 29–65) sätter `verifiedAt` direkt
eftersom ops skapat kunden. Nytt i `customer.service.ts`:
`countUnverifiedCustomers()` och `verifyCustomer(customerId, priceListId)` —
verifiering kräver prislista, annars fel och ingen skrivning.
`kunder/page.tsx`: kolumn "Status" med `StatusChip` "Ny, ej verifierad" (tone
`next`) när `verifiedAt === null`; `?filter=ny` filtrerar. `kunder/[id]/page.tsx`:
panel "Verifiera kund" överst med prislista-select och knappen "Verifiera".

### Artwork-granskning i ops — godkänn/neka med notering

Ny `src/ui/ops/ArtworkReviewCard.tsx` (mönster: BBB `material-review-card.tsx`
rad 16–33 + `admin-skyltko-client.tsx` rad 132–139). Ersätter formuläret i
`ordrar/[orderNo]/page.tsx` rad 165–170.

```tsx
<form action={approveArtworkAction}>…<Button>Skicka korrektur till kund</Button></form>
<form action={rejectArtworkAction} className="space-y-2">
  <input type="hidden" name="orderNo" value={orderNo} />
  <textarea name="note" required placeholder="Vad ska kunden ändra?" className={controlClass} />
  <Button variant="secondary">Neka och be om ny fil</Button>
</form>
```

`rejectArtworkAction` (ny bredvid rad 508 i `src/actions/index.ts`, grindad med
`isAquaAdmin` som rad 236) → `rejectArtwork(orderId, role, note)` i
`artwork.service.ts`: skapar `ArtworkApproval { kind: "AQUA_REJECTED", note }`
(ny medlem i `ArtworkApprovalKind`, schema rad 116–119), rör **inte**
`currentStatus`, mejlar via `getIntegrations().email` som rad 103 (respekterar
`EMAIL_PAUSED`). Ny regel `artwork_rejected` i `exceptions.ts` RULES: "Kund ska
ladda upp ny artwork", `yellow`, tills ny `ArtworkVersion` skapas. Kundytan
(fil 05/06) visar senaste noteringen; här bara kontraktet.

### `/labels` och `/bottler` — `SupplierDesk` får KPI + NeedsAttention

Sidfilerna behålls. I `SupplierDesk.tsx` ersätts rad 90–124 med gemensam KPI-rad
och ett `NeedsAttention`-block. Inga `kr`, fakturor eller kundpriser.

```tsx
const counts = supplierCounts(visible, shipped, kind, today); // ny, src/domain/supplierDesk.ts
<KpiStrip>
  <KpiCard href={`${basePath}?f=nya`}      label="Nya jobb att acceptera" value={counts.toAccept} />
  <KpiCard href={`${basePath}?f=pagaende`} label="Pågående"              value={counts.active} />
  <KpiCard href={`${basePath}?f=vecka`}    label="Deadline denna vecka"   value={counts.dueThisWeek} />
  <KpiCard href={`${basePath}/skickat`}    label="Skickat"                value={shipped.length} />
</KpiStrip>
```

`supplierCounts` (ren, testbar): label `toAccept` = `!factoryDeadlineAccepted &&
status ∈ {CONFIRMED, LABEL_PRODUCTION}` (= `canMarkReady`, rad 172–174),
`active` = accepterad `LABEL_PRODUCTION`, `dueThisWeek` = `factoryDeadline` inom
ISO-veckan. Bottler `toAccept` = `LABELS_DISPATCHED`, `active` = `LABELS_RECEIVED |
PRODUCTION_SCHEDULED | IN_PRODUCTION`, `dueThisWeek` = `aquaApprovedDelivery ??
factoryReadyEstimate` inom veckan.

`NeedsAttention`-rader, en per jobb, länk till `${basePath}/jobb/${id}`:

| Roll | Villkor | Radtext | Primär knapp på jobbsidan |
|---|---|---|---|
| label | `toAccept` | "Acceptera deadline {datum}" | "Klara att skicka" (`labels/jobb/[jobId]/page.tsx` rad 96–101) |
| label | accepterad, deadline passerad | "Rapportera POD — deadline passerad" | "Bekräfta utskick till bottler" (rad 117–128) |
| bottler | `LABELS_DISPATCHED` | "Ta emot etiketter" | "Etiketter mottagna" (`bottler/jobb/[jobId]/page.tsx` rad 64–72) |
| bottler | `READY_TO_SHIP` | "Rapportera POD / skicka" | "Markera skickad" (rad 115–123) |

`inboundReports`-korten (rad 108–118) blir första rader i samma block.
`LabelJobsTable` och `BottlerJobsTable` får en sista kolumn "Åtgärd" med en
`LinkButton size="sm"` till jobbsidan — en knapp per rad, `RowHit` kvar.
`statusHint(order, role)` från fil 06 får ordböcker för `LABEL` och `BOTTLER` i
`enums.ts` bredvid `BUYER_STATUS` (rad 41–58), t.ex. `LABELS_DISPATCHED` (bottler)
→ "Ta emot etiketter", `READY_TO_SHIP` → "Printa fraktsedel · markera skickad".
`bottlerDeskStatus` avvecklas när hinten finns.

### Vad som **inte** kopieras

- Inga `kr`, `formatSEK`, intäkt eller fakturastatus till `/labels`/`/bottler`
  (BBB `intakter/page.tsx`, `OwnerOverview` rad 946–957).
- Inga seedade plattformssiffror (BBB `AdminOverview` rad 225–236). Aqua-KPI:er
  är alltid åtgärdstal från riktiga ordrar.
- Ingen `AgencyOverview` — ingen ÅF-portal i V1. Ingen egen `ReviewerShell` —
  ops granskar i Master Dashboard.

## Kontraktskontroll

- **Inga kr på leverantörsytor.** Grep-bar regel, ska ge noll träffar (gör det idag):
  `rg -n "\bkr\b|formatSEK|priceSnapshot|unitPriceExVat|invoice" src/ui/supplier "src/app/(labels)" "src/app/(bottler)"`.
  `factoryOrder` (`production.service.ts` rad 19–62) är enda datakällan för
  `SupplierDesk` och får inte utökas med pris- eller fakturafält.
- **Irreversible aldrig av automation.** Slutlig OB (`sendObAction`, rad 172–191
  i orderdetaljen), Fakturera och markera betald ligger bakom gate `irreversible`
  (`src/lib/orchestrator/approvals.ts` rad 2, 6). `NeedsAttention` länkar, kör
  aldrig actionen. `verifyCustomer` och `rejectArtwork` är reversibla och grindas
  med `isAquaAdmin`.
- **Prislistor blandas inte.** Verifiering sätter `priceListId` en gång
  (`Customer.priceList`, schema rad 172, 179). Ops-hemmet visar belopp från
  `priceSnapshotJson` (`OrderResultsTable.tsx` rad 11–17), aldrig omräknat.
- **Roller via `requireRole` / `requireSupplier`.** `/operations` grindas i
  `src/app/(operations)/operations/layout.tsx` rad 7 (`requireRole(["AQUA_STAFF",
  "AQUA_ADMIN"])`, `src/server/rbac.ts` rad 37–49). `/labels` och `/bottler` i
  respektive `layout.tsx` rad 7 via `requireSupplier` (`src/server/supplierAccess.ts`
  rad 7–20), scopat med `scopedFactoryId` rad 22–28. `AQUA_STAFF` = `AQUA_ADMIN`
  (`src/domain/policies/roles.ts` rad 2–4). Inga nya roller.

## Acceptanskriterier

1. Inloggad som `labels@` (LABEL): `/labels`, `/labels/jobb/[id]`, `/bottler`,
   `/bottler/jobb/[id]`, `/bottler/skickat` innehåller inte strängen "kr"
   (`curl -b cookie <url> | rg -c "\bkr\b"` → 0). Grep-regeln ovan ger 0 träffar.
2. `/operations` KPI "Att bekräfta" = antal `SUBMITTED + AQUA_REVIEW`, "Nya
   kunder" = antal `verifiedAt IS NULL`; siffrorna matchar de länkade listorna.
3. Självregistrerad kund (fil 01) syns som "Ny, ej verifierad" i `/operations/kunder`
   och i `NeedsAttention`. Efter "Verifiera" med prislista försvinner raden och
   `verifiedAt` är satt. Utan prislista: fel, ingen skrivning.
4. Order i `ARTWORK_AQUA_REVIEW`: neka utan notering blockeras; med notering
   skapas `ArtworkApproval(kind = AQUA_REJECTED)`, `currentStatus` oförändrad,
   `artwork_rejected` syns på `/operations`.
5. `/labels`: jobb med `factoryDeadlineAccepted = false` ger raden "Acceptera
   deadline"; efter "Klara att skicka" försvinner den och KPI:n minskar med ett.
6. `/bottler`: order i `LABELS_DISPATCHED` ger "Ta emot etiketter"; efter
   "Etiketter mottagna" räknas den under "Pågående".
7. Varje rad i `LabelJobsTable`/`BottlerJobsTable` har exakt en knapp.
8. `rg -n "sendObAction|verifyCustomer|rejectArtwork" src/lib/orchestrator` → 0.
9. `supplierCounts` har enhetstest i `src/domain/supplierDesk.test.ts` (stil som
   `exceptions.test.ts`, `node:test`). `package.json` (rad 5–16) saknar testskript;
   Våg E lägger till `"test": "node --import tsx --test src/**/*.test.ts"` (ingen vitest).
10. `LABEL` som öppnar `/bottler` redirectas till `/labels` (`supplierAccess.ts` rad 11).

## Beroenden

- **01** — sätter `Customer.source = "self_signup"`, `verifiedAt = null`. Utan
  01 visar KPI:n 0; bygget bryts inte.
- **06** — `NeedsAttention`, `KpiCard`, `QuickLinks`, `statusHint(order, role)`.
  Om 06 inte är klar byggs blocken tillfälligt med dagens `ActionList`/`ActionCard`
  (primitives rad 66–92) och byts sedan.
- Schemaändringen körs med `prisma db push` lokalt först; produktion via
  Railway-build (`package.json` rad 7) kräver `av-bug-hunter-prepush`.

## Uppskattad storlek

- `operations/page.tsx`: omskrivning ~120 rader (från 84).
- Schema + `customer.service.ts` + två kundsidor: ~90 rader.
- `ArtworkReviewCard` + `rejectArtwork` + action + exception-regel: ~80 rader.
- `SupplierDesk` + `src/domain/supplierDesk.ts` + test + tabellkolumner +
  rollordböcker: ~160 rader.
- Totalt ~450 rader i fyra PR:ar: schema+kunder → ops-hem → artwork-neka →
  SupplierDesk. Cirka två arbetsdagar.
