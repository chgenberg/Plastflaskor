# 09 · Agentens arbetsmetod: regler, QA och vandring

Förebild: Billboardbee 2.0 (`/Users/christophergenberg/Desktop/Billboardbee-2.0`, "BBB").
Mål: Aqua Visibility OS (`/Users/christophergenberg/Desktop/Par_tryckeri`, "Aqua").
Den här filen äger **hur agenten arbetar**: regler per invariant, QA-skript, rapportformat, minnesdisciplin, säkra Hands.
Den äger inga produktytor. Fil 01–03 äger köpflödet; fil 10 äger deploy/cutover och gate:as av den här.

## Mål

Samma metod som byggde BBB, anpassad till profilvatten:

- **En regel per invariant.** Varje kontrakt som får kosta pengar om det bryts
  (`kr` publikt, fabrik ser faktura, blandad prislista, rörd snapshot) är en egen
  `alwaysApply`-regel, inte en rad i en lång lista.
- **Audits styr vågorna.** Rapporter under `audits/` med formatet
  `N CRITICAL · N HIGH · N MEDIUM` avgör vad som byggs nästa vecka. Inte magkänsla.
- **Vandring före deploy.** En throwaway-kund går igenom hela kedjan mot Railway
  innan `git push main`. Rapporten måste vara 0 CRITICAL / 0 HIGH.
- **Minne per dag.** Varje tur som rör mer än en fil lämnar en rad i
  `.cursor/orchestrator/memory/YYYY-MM-DD.md`.
- **Hands lagar bara det ofarliga.** Aldrig Fakturera, markera betald, slutlig OB,
  deploy, pris, lyfta mejlpaus.

## Vad BBB gör

### Regler (`.cursor/rules/`, 10 filer)

| Fil | Typ | En rad |
| --- | --- | --- |
| `agent-naming.mdc` | alwaysApply | Användarvänd text säger "agenten", aldrig AI/Fable. Kodidentifierare undantagna. |
| `tone-of-voice.mdc` | globs (publik copy) | Korta meningar, "du", inga utropstecken, kill-list ("Upptäck", "Oavsett om", "Från X till Y. Utan Z." max en gång). |
| `owner-name-never-public.mdc` | alwaysApply | Mediaägarens namn syns aldrig på publik sida eller i slug. |
| `skylt-terminologi.mdc` | alwaysApply | Alltid "skylt", aldrig "tavla"/"skärm". |
| `digital-from-price-sov.mdc` | globs (pricing) | Från-pris = 3 % SoV av dagskostnad, aldrig fullt pris. |
| `multi-surface-is-package.mdc` | globs (schema/import) | En Sign = en yta; flera ytor = SignPackage. |
| `manual-analog-inventory.mdc` | globs | Hur manuell analog inventory modelleras och prissätts. |
| `bbb-orchestrator.mdc` | alwaysApply | Boot: MEMORY + dagsminne + workboard → klassificera → claima kort → grindar. |
| `prepush-bughunt.mdc` | alwaysApply | Bug-hunt-skill måste ha körts ren före varje AWS-deploy. |
| `no-github.mdc` | alwaysApply | Leverans bara via AWS CodeBuild/App Runner. **Kopieras inte** — Aqua deployar via GitHub → Railway. |

### Orkestrator-loop

- `.cursor/orchestrator/{SOUL,DREAMS,HEARTBEAT,MEMORY,WORKBOARD}.md` + `memory/2026-08-31.md`, `2026-09-01.md`, `2026-09-03.md`.
- Skill `.cursor/skills/bbb-orchestrator/{SKILL,reference}.md`.
- Körbar karta `src/lib/orchestrator/{graph,approvals,hands,heartbeat,pulse,cards,memory,workboard}.ts`.
- Portabel mall `templates/agent-os/{README,HANDBOOK,ADAPT,CHECKLIST}.md` + `skeleton/`. Aquas `ADAPT.md` är ifylld från den.
- `HEARTBEAT.md` listar checkar med kortnyckel + Hand + tak (`pending-sign:<id>` → `reviewSignListing` max 1/tick, `booking-email:<id>` → max 8/tick, `qc-gap:<id>` → max 3/tick). "Aldrig på ett tick: Deploy, Koppla, lyfta EMAIL_PAUSED, sätta pris, skicka outreach."
- Dagsminnet är en punktlista av fakta, inte prosa. Exempel 2026-09-03: "Deploy stoppad: CodeBuild `AccountLimitExceededException` … Live image oförändrad."

### QA-pyramid (`scripts/qa/`)

| Nivå | Fil | Vad |
| --- | --- | --- |
| Read-only crawl | `prod-smoke.mjs` | Publika rutter + riktiga detaljsidor, öppnar popup utan submit. Fångar 4xx/5xx, `pageerror`, console.error. Skriver `audits/prod-smoke/REPORT.md`. |
| Layout | `_probe-overflow.mjs` | Varje publik sida vid 390 och 768 px; rapporterar element bredare än viewport med selektor. |
| Design per roll | `design-shots.mjs` | Loggar in som varje roll (`design-*@billboardbee-qa.example.com`), full-page PNG desktop + mobil, console/4xx till `findings.json`. |
| Persona-armé | `persona-army.mjs`, `persona-army-prod.mjs`, `persona-sweep.mjs`, `persona-extra.mjs` | N personas per roll klickar genom flöden. Sweep kör även copy-regler (skärm/tavla, AI/Fable). |
| Multi-roll | `prod-multi-role-matrix.mjs`, `prod-e2e-full.mjs` | Ägare skapar → admin godkänner → annonsör bokar → ägare ser utan läcka. |
| Vandring | `prod-walkthrough.mjs` | Throwaway-personas `walk.<stamp>@…-qa.example.com` genom alla roller mot prod med `DATABASE_URL`. `scanCopy` flaggar `undefined|NaN|[object Object]` som HIGH. |
| Städ | `_cleanup-matrix.mjs`, `_qa_cleanup.ts` | Tar bort allt på QA-domänen om inte `WALK_KEEP=1`. |

Alla använder `playwright-core` (`^1.60.0`, devDependency) mot lokal Chrome-binär, ingen `@playwright/test`.

Rapporter: `audits/{persona-army,persona-army-prod,prod-smoke,prod-uiux-full-matrix}/REPORT.md`, `audits/persona-sweep/{REPORT,FINDINGS}.md`,
`audits/prod-walkthrough/<stamp>/{REPORT.md,report.json,shots/}`, `audits/FORBATTRING-MASTERPLAN.md` (våg A–C ur fynden), `audits/CUTOVER.md` (DNS-flytt-checklista).
`prod-uiux-full-matrix/REPORT.md` aggregerar tre körningar (`design-shots.log`, `multi-role-matrix.log`, `persona-army.log`) — inget eget skript.

### Rapportformat (ur `audits/prod-walkthrough/mtfr22ve/REPORT.md`)

```text
# Produktionsvandring mtfr22ve
- Tid: 2026-08-30T11:54:04.424Z
- Bas: https://sk3nq5auk2.us-east-1.awsapprunner.com
- Annonsörbokning: BK-2026-003
- Skärmdumpar: 33 st i `shots/`
## Sammanfattning
Inga blocker funna — flödet hänger ihop.
**0 CRITICAL · 0 HIGH · 0 MEDIUM**
## CRITICAL
Inga.
```

Sedan `## HIGH`, `## MEDIUM`, `## Personas (städas efter körning om inte WALK_KEEP=1)`. Varje fynd: `[SEV] (roll) var · vad · shot: sökväg`.

### Walkthrough-skill (`~/.cursor/skills/bbb-prod-walkthrough/SKILL.md`)

Triggas på "kör produktionsvandringen". Hämtar prod-DB från Secrets Manager utan att skriva ut strängen, kör `prod-walkthrough.mjs`, läser `REPORT.md`.
"Klicka aldrig QueenCloud **Koppla** (riktig licensfaktura)." Svar: `Vandring klar — N CRITICAL, N HIGH, N MEDIUM.` + 3–8 rader.

### Booking-agentens kontrakt (`src/lib/agent/{engine,llm,rank,types,anthropic}.ts`)

`types.ts` rad 3: "the model never authors numbers." `engine.ts` äger state machine och alla siffror; `llm.ts` parsear fritext, klassar bransch,
skriver copy och väljer bland serverrankade kandidater (`rank.ts`). Pris, kontakter och skyltdata kommer alltid från katalog + `pricing.ts`.

## Vad Aqua har idag

- Regler: `.cursor/rules/{orchestrator,prepush-bughunt,skylt-source-of-truth}.mdc`. Alla tre alwaysApply.
- Orkestrator: `.cursor/orchestrator/{SOUL,MEMORY,HEARTBEAT,DREAMS,WORKBOARD,ADAPT}.md`, `memory/2026-09-01.md` (en dag).
- Skills: `.cursor/skills/{orchestrator,av-bug-hunter-prepush,skylt-och-gravyr}/`.
- Kod: `src/lib/orchestrator/{graph,approvals,hands,heartbeat,probes,cards,groups,memory,memory-shipped,workboard,workboard-types}.ts`, `workboard.json`, `approvals.test.ts`, `graph.test.ts`.
  `hands.ts` är stub: `CAPS = []`, `tryFixKey` returnerar alltid `null`. `probes.ts` speglar `EXCEPTION_SEVERITY` från `src/domain/exceptions.ts` till kort.
- Puls: `POST /api/cron/heartbeat` med `x-cron-secret` (`CRON_SECRET`), `runAquaHeartbeat` i `src/server/orchestrator.ts`.
- Grindar: `approvals.ts` — `irreversible` alltid nej; `deploy` kräver `bugHuntClean` + `explicitYes`; `email` nej om `emailPausedFromEnv()`.
- Kontrakt i kod: `src/domain/policies/priceVisibility.ts` (`canSeePrices`, `canSeeFinance`, `stripPrices`), `src/server/supplierAccess.ts` (`requireSupplier`),
  `src/server/services/order.service.ts` (`sendOrderConfirmation` sätter `priceSnapshotJson` + `lockedAt`; `saveExtras` kastar "Ordern är låst"),
  `src/server/services/catalog.service.ts` (`getPriceListForBuyer`, `resolveUnitPrice`), `prisma/schema.prisma` enum `PriceListCode { STANDARD SILVER GOLD SPECIAL }`
  visas som Standard/Partner/Key Account/Specialavtal via `src/domain/priceLists.ts`.
- Tester: `node:test` i `*.test.ts` (`checkout.service.test.ts`, `catalog.service.test.ts`, `exceptions.test.ts` …). Inget `test`-script i `package.json`.
- Demo: `prisma/seed.ts` rad 713–772 skapar `staff@/admin@/bottler@/labels@/kund@demo.aqua`.
- `scripts/` är tom. `audits/` finns inte. `docs/masterplan/` har bara `02-produktsida-som-kassa.md`.

### Gap

1. Inga produktspecifika invariant-regler — allt ligger som rader i `skylt-source-of-truth.mdc` och `SOUL.md`.
2. `scripts/qa/` saknas. Ingen `playwright-core`.
3. `audits/` saknas. Ingen rapport har producerats.
4. Ingen walkthrough-skill.
5. Dagsminne: en fil, ingen rutin för vad varje tur appendar.
6. `hands.ts` gör inget.
7. Ingen order-agent (V2).
8. Nytt köpflöde (01–03) inför publik registrering utan QA som bevisar att anonym aldrig ser `kr`.

## Ändringar

### A. Nya regler i `.cursor/rules/` (alla `alwaysApply: true`)

**`agent-naming.mdc`**

```md
---
description: Användarvänd text säger alltid "agenten" — aldrig AI, assistenten eller modellnamn
alwaysApply: true
---
# Säg "agenten"
Gäller JSX-copy, knappar, placeholders, aria-labels, fel, mejl, PDF, metadata och LLM-prompter
vars utdata visas för användare. Skriv "Agenten granskar ditt artwork", inte "AI-granskning".
Undantag: kodidentifierare, loggar, env, modell-ID. Byt aldrig route-namn för regeln.
Kontroll: `rg -n "\bAI\b|assistenten|chatbot" src/app src/ui src/content` → bara kommentarer.
```

**`no-public-prices.mdc`**

```md
---
description: Publik katalog och studio visar aldrig kr, unitPriceExVat eller prislistor för anonym
alwaysApply: true
---
# Inga publika priser
`src/app/(public)/**` och `src/app/(studio)/**` renderar aldrig ` kr`, `unitPriceExVat`, `minQty`
eller prislistnamn utan inloggad CUSTOMER/Aqua. Grinden är `canSeePrices` i
`src/domain/policies/priceVisibility.ts` — i sidan OCH i server-actionen. Publika DTO:er går via
`publicProductDto` i `catalog.service.ts`. Anonym ser "Pris visas när du skapar konto".
Kontroll: `curl -s <url> | grep -c " kr"` → 0 utloggad. `scripts/qa/prod-smoke.mjs` failar annars.
```

**`supplier-never-sees-kr.mdc`**

```md
---
description: Etikett (/labels) och bottler (/bottler) ser aldrig kr, fakturor eller kundens prislista
alwaysApply: true
---
# Fabriken ser inte pengar
Sidor och actions under `src/app/(labels)/**`, `src/app/(bottler)/**`, `/api/bottler/**` går genom
`requireSupplier` (`src/server/supplierAccess.ts`) och `stripPrices`. Ingen Prisma-include av
`invoice`, `priceSnapshotJson`, `unitPriceExVat`, `amountExVat`. PDF:er (leveransrapport LR-,
fakturaunderlag BF-) har antal och datum, inte belopp. `canSeeFinance` är bara Aqua Admin.
Kontroll: `rg -n "invoice|amountExVat|unitPriceExVat| kr" src/app/\(labels\) src/app/\(bottler\)` → 0.
```

**`pricelist-never-mixed.mdc`**

```md
---
description: En order prissätts från exakt en prislista, vald på servern från kundens customerId
alwaysApply: true
---
# Prislistan blandas inte
`PriceListCode` (STANDARD/SILVER/GOLD/SPECIAL) väljs av `getPriceListForBuyer({ customerId })` i
`src/server/services/catalog.service.ts`. Klienten skickar aldrig pris, tier eller listkod.
Ny kund utan avtal får STANDARD. Byte av lista sker bara i `/operations/kunder/[id]` av Aqua.
Checkout repriserar med `resolveUnitPrice` — även om panelen visade ett annat tal.
Visningsnamn (Partner/Key Account) kommer från `src/domain/priceLists.ts`, inte hårdkodat.
```

**`snapshot-immutable.mdc`**

```md
---
description: priceSnapshotJson + lockedAt sätts en gång i sendOrderConfirmation och ändras aldrig
alwaysApply: true
---
# Snapshot är låst
`sendOrderConfirmation` i `src/server/services/order.service.ts` bygger `priceSnapshotJson` och
sätter `lockedAt`. Efter det: inga writes till items, extras, pris eller snapshot. Alla mutationer
kontrollerar `if (order.lockedAt) throw` som `saveExtras` gör. Faktura, PDF och "Beställ igen"
läser snapshoten, aldrig om pris från katalogen. Slutlig OB klickas av Aqua, aldrig av en Hand.
Ny kolumn som påverkar pris → in i snapshoten, inte bredvid.
```

**`tone-of-voice.mdc`** (anpassad kill-list)

```md
---
description: Aqua-röst för publik copy — nordiskt, konkret, "du", inga utropstecken
alwaysApply: true
---
# Aqua-röst
Korta meningar. En fördel per mening. Tilltala "du". Presens, aktiv form. Inga utropstecken.
Kill-list: "Vi finns här för att hjälpa dig", "Välkommen till", "Upptäck", "Oavsett om",
"premium", "unik", "skräddarsydd", "AI-driven", "hållbarhetsresa", "smakupplevelse".
"Från X till Y. Utan Z." max en gång på sajten. Engelska ord bara om de är produktnamn.
Siffror konkreta: "33 cl, minst 500 flaskor, klart om 15 arbetsdagar" — inte "snabb leverans".
Terminologi: "profilvatten", "etikett", "kork", "flaska" — aldrig "produkt" när ordet finns.
```

### B. `scripts/qa/` (nytt; `playwright-core` som devDependency — beslut, se Beroenden)

| Fil | Innehåll |
| --- | --- |
| `prod-smoke.mjs` | Read-only crawl mot `QA_BASE` (default `https://plastflaskor-production.up.railway.app`): `/`, `/produkter`, `/produkter/profilvatten`, tre riktiga produktslugs hämtade live, `/valmojligheter`, `/inspiration`, `/miljo`, `/om`, `/offert`, `/login`. Fångar 4xx/5xx, `pageerror`, console.error. **Extra check:** `document.body.innerText` får inte matcha `/\d\s?kr\b/` utloggad → CRITICAL. Skriver `audits/prod-smoke/REPORT.md`. |
| `_probe-overflow.mjs` | Samma sidor + `/designa` vid 390 och 768 px. Rapporterar `el.scrollWidth > innerWidth` med selektor. |
| `design-shots.mjs` | Loggar in som `kund@/admin@/labels@/bottler@demo.aqua` (lösenord från `QA_PASSWORD`, aldrig i fil). Full-page PNG av varje route under `(konto)`, `(operations)`, `(labels)`, `(bottler)` desktop + 390 px till `OUT` (default `/tmp/av-design`). För `labels@`/`bottler@`: innerText mot `/\d\s?kr\b|faktura/i` → CRITICAL. |
| `persona-walkthrough.mjs` | Se nedan. |
| `_cleanup-qa.ts` | `tsx`-script: raderar `User`, `Customer`, `Order` med e-post på `@aqua-qa.example.com` om inte `WALK_KEEP=1`. Tar stamp som argument. |

**`persona-walkthrough.mjs`** — kedjan i ordning, varje steg tar shot + assert:

1. Anonym: produktsida → panelen saknar ` kr` (CRITICAL annars).
2. Registrera ny kund `walk.kund.<stamp>@aqua-qa.example.com` via kassa-modalen (fil 03). Max fyra skärmar till `/kassa/bekraftelse` — räkna URL-byten; fler → HIGH.
3. Prisma: kundens prislista är `STANDARD`; ordern har `source`, `customerId`, inga `lockedAt`.
4. `admin@`: `/operations/ordrar/<orderNo>` → artwork OK → korrektur → simulera kundgodkännande (CUSTOMER_FINAL) → **slutlig OB klickas inte**; i stället anropas `sendOrderConfirmation` via Prisma-seedad status bara om `WALK_OB=1` sätts explicit av användaren. Default: stanna före OB och rapportera "OB väntar på människa".
5. `labels@`: jobbet syns i `/labels`, `ACCEPT_DEADLINE` via UI, innerText utan `kr`.
6. `bottler@`: etiketter mottagna → klar → "Markera skickad" (POD). Utan `kr`, utan `faktura`.
7. `admin@`: `/operations/ekonomi` visar "Redo att fakturera". **Fakturera klickas aldrig.**
8. Cleanup om inte `WALK_KEEP=1`. `REPORT.md` + `report.json` + `shots/` till `audits/prod-walkthrough/<stamp>/`.

```js
// scripts/qa/persona-walkthrough.mjs (utdrag)
const NEVER_CLICK = [/fakturera/i, /markera betald/i, /skicka orderbekräftelse/i];
async function click(page, label, where) {
  if (NEVER_CLICK.some((re) => re.test(label))) {
    return record("INFO", where, `Irreversible knapp "${label}" lämnas till människa.`);
  }
  await page.getByRole("button", { name: label }).click();
}
async function assertNoKr(page, where) {
  const text = await page.locator("body").innerText();
  if (/\d\s?kr\b/.test(text)) record("CRITICAL", where, "kr synligt", await shot(page, where));
}
```

### C. `audits/` (nytt)

`audits/{prod-smoke,design-shots}/REPORT.md`, `audits/prod-walkthrough/<stamp>/{REPORT.md,report.json,shots/}`, `audits/FORBATTRING-MASTERPLAN.md`.

`FORBATTRING-MASTERPLAN.md`-mall: rubrik + utgångsläge (senaste vandringens tal) → "Det som redan är starkt (rör inte)" → Våg A (pengar/säkerhet) → Våg B (vägar som slutar fel) → Våg C (mobil/copy) → "Efter varje våg: walkthrough + bug-hunt. Deploy bara på uppmaning." Varje punkt citerar fil.

### D. Skill `.cursor/skills/av-prod-walkthrough/SKILL.md`

Frontmatter `name: av-prod-walkthrough`, trigger: "kör produktionsvandringen", "vandra prod", "testa hela kedjan".
Innehåll: (1) `DATABASE_URL` från `railway variables --json` utan att skriva ut, (2) `QA_BASE=… node scripts/qa/persona-walkthrough.mjs`,
(3) läs `REPORT.md`, (4) "Vad som måste faila": anonym ser `kr`; ny kund får annan lista än STANDARD; bekräftelse efter >4 skärmar;
labels/bottler ser `kr`/faktura; `undefined|NaN` i synlig text; "AI" i användartext. (5) Klicka aldrig Fakturera, markera betald, slutlig OB.
Svar: `Vandring klar — N CRITICAL, N HIGH, N MEDIUM.` + 3–8 rader med sökväg.

### E. Daily-memory-rutin (tillägg i `.cursor/rules/orchestrator.mdc` steg 5 och `HEARTBEAT.md`)

Varje tur som rör >1 fil appendar **en rad** till `.cursor/orchestrator/memory/YYYY-MM-DD.md`: vad ändrades, varför, ev. commit-hash.
Deploy-rader skrivs alltid: "Deploy `<hash>` live: <en mening om vad>". Fel som stoppade: "Stopp: <orsak>". QA-körningar: "Vandring `<stamp>`: N/N/N".
Fakta som håller i veckor (nya kontrakt, nya konton, nya env) flyttas till `MEMORY.md`. Inga lösenord, inga connection-strängar.

### F. Första säkra Hands (`src/lib/orchestrator/hands.ts`)

`NEVER`-regexen (`email-paused|ex:invoice:|confirm:|paid:|nightly-error:`) behålls. Tre Hands, alla idempotenta och med tak:

```ts
const CAPS = [
  { test: (k: string) => k.startsWith("ex:deadline_unaccepted:"), max: 5 },
  { test: (k: string) => k.startsWith("ex:artwork_customer:"), max: 5 },
  { test: (k: string) => k.startsWith("order-email:"), max: 8 },
];
export async function tryFixKey(key: string): Promise<HandResult | null> {
  if (NEVER.test(key)) return null;
  if (key.startsWith("order-email:")) {
    if (emailPausedFromEnv()) return null;            // väntar, lyfter inte flaggan
    await notifyOrderChange(id(key), "CONFIRMED");    // src/server/services/notify.ts
    return { ok: true, did: "Agenten skickade om orderbekräftelsen." };
  }
  if (key.startsWith("ex:deadline_unaccepted:")) {
    await remindFactory(id(key), "label");            // in-app-notis, inget mejl
    return { ok: false, did: "Påminnelse lagd hos etikettproducenten. Kortet ligger kvar." };
  }
  return null;
}
```

`ok: false` för påminnelser så kortet inte stängs (matchar huvudkommentaren i filen). Inga Hands för `ex:invoice:`, `ex:review:` (människa granskar), deploy eller pris.

### G. Order-agent (V2, efter BBB-kontraktet)

Märkt V2 — ingen kod i den här vågen. Kontrakt: `src/lib/agent/engine.ts` äger steg (`variant → qty → water/cap → artwork → konto → bekräftelse`) och alla tal från `resolveUnitPrice`;
`llm.ts` parsear fritext ("500 stilla 33 cl med vår logga") till `ProductSelection` och skriver copy. Modellen författar aldrig ett pris. Samma `NEVER_CLICK` som vandringen.

## Kontraktskontroll

- **Serverpris.** `prod-smoke.mjs` och `persona-walkthrough.mjs` läser aldrig pris från klienten; assert sker mot Prisma (`priceSnapshotJson.amountExVat`) och `resolveUnitPrice`.
- **Snapshot immutabel.** Vandringen stannar före OB om inte `WALK_OB=1`. Efter OB: `saveExtras` ska kasta "Ordern är låst" — testas som negativt fall.
- **Inga publika kr.** `no-public-prices.mdc` + `assertNoKr` i två skript + `curl | grep -c " kr"` i acceptans.
- **Prislistor blandas inte.** Vandringen asserterar `STANDARD` på ny kund; `pricelist-never-mixed.mdc` förbjuder pris i klient-props.
- **Etikett/bottler utan kr/fakturor.** `supplier-never-sees-kr.mdc` + `design-shots.mjs` innerText-check + `rg` i acceptans. `requireSupplier` förblir enda ingången.
- **Irreversible aldrig av automation.** `NEVER_CLICK` i skript, `NEVER` i `hands.ts`, `canExecute("irreversible")` alltid nej.
- **Deploy.** `prepush-bughunt.mdc` oförändrad; vandringen läggs till som andra gate i fil 10. Ingen `no-github`-kopia — Railway auto-deployar från `main`.
- **EMAIL_PAUSED.** Hands returnerar `null` när `emailPausedFromEnv()`; skripten skickar inga mejl (throwaway-domän `@aqua-qa.example.com`).
- **"agenten".** `agent-naming.mdc` + copy-scan `/\bAI\b|assistenten/` i vandringen → MEDIUM.

## Acceptanskriterier

1. Sex nya regelfiler finns i `.cursor/rules/` med `alwaysApply: true` och citerar existerande sökvägar.
2. `node scripts/qa/prod-smoke.mjs` går grönt mot Railway: `audits/prod-smoke/REPORT.md` visar `0 CRITICAL · 0 HIGH`.
3. `BASE=http://localhost:3000 node scripts/qa/_probe-overflow.mjs` rapporterar 0 element bredare än 390 px på publika sidor.
4. `design-shots.mjs` producerar PNG för alla fyra roller; `rg -c "kr|faktura" audits/design-shots/REPORT.md` för labels/bottler → 0.
5. `persona-walkthrough.mjs` mot Railway: ny kund når `/kassa/bekraftelse` på ≤ 4 skärmar, prislista `STANDARD`, labels accept + bottler POD utan `kr`, stannar före OB och Fakturera, cleanup lämnar 0 rader på `@aqua-qa.example.com`.
6. Walkthrough-rapport `0 CRITICAL / 0 HIGH` finns i konversationen före varje `git push main` (utöver bug-hunt).
7. `.cursor/orchestrator/memory/` har en fil för varje dag agenten arbetat, med minst en rad per tur som rörde >1 fil.
8. `hands.ts`: `tryFixKey("ex:invoice:AV-1")` → `null`; `tryFixKey("order-email:x")` med `EMAIL_PAUSED=1` → `null`. Täckt av `hands.test.ts` med `node:test`.
9. `rg -n "\bAI\b" src/app src/ui src/content --glob '!*.test.*'` → bara kodkommentarer.
10. `npm run build` och `node --test` (nytt script `"test": "tsx --test src/**/*.test.ts"`) passerar.

## Beroenden

- **Går parallellt med allt.** Reglerna (A) kan skrivas idag. `prod-smoke`, `_probe-overflow`, `design-shots` behöver bara att sajten svarar.
- **01–03** — `persona-walkthrough.mjs` steg 1–3 kräver publik registrering och `/kassa/bekraftelse`. Tills dess körs steg 4–8 med `kund@demo.aqua` och en seedad order.
- **10 (deploy/cutover)** — gate:as av den här filen: ingen push utan vandring 0/0 + bug-hunt ren. `audits/FORBATTRING-MASTERPLAN.md` blir 10:s input.
- **Beslut:** `playwright-core` som devDependency (BBB-mönstret, ingen `@playwright/test`), Chrome-binär från `~/Library/Caches/ms-playwright` som i BBB:s `_probe-overflow.mjs`. `test`-script saknas i `package.json` idag; läggs till för `hands.test.ts`.

## Uppskattad storlek

| Delmoment | Storlek |
| --- | --- |
| Sex regelfiler (A) | S |
| `prod-smoke.mjs`, `_probe-overflow.mjs` | S |
| `design-shots.mjs` per roll + kr-check | M |
| `persona-walkthrough.mjs` + `_cleanup-qa.ts` | L |
| `audits/`-struktur + `FORBATTRING-MASTERPLAN.md`-mall | S |
| Skill `av-prod-walkthrough` | S |
| Daily-memory-rutin (regeltext + HEARTBEAT) | S |
| Hands (3 st) + `hands.test.ts` + `test`-script | M |
| Order-agent | V2, ej i denna våg |

Totalt: **L**. Tre till fyra arbetsdagar; regler + smoke + minne första dagen, vandring när 03 landat.
