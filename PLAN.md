# AquaVisibility OS — gemensam körplan (V1)

Detta är den låsta planen som implementationen ska följa. Nio delplaner (stack, tokens, datamodell, publik sajt, studio, ÅF, operations, fabrik, integrationer) är sammanslagna här. Vid konflikt gäller **detta dokument**.

**Mål:** AquaVisibility.se ska inte upplevas som en webshop. Det är det publika lagret på **AquaVisibility OS** — ett system för produkt → återförsäljare → order → artwork → etikett → fabrik → leverans → fakturering.

Workspace är greenfield. Nuvarande sajt är WooCommerce; vi bygger om från noll, med samma verkliga sortiment (profilvatten Tollagården/Stenkulla, muggar, energidryck, sportflaskor) men som SaaS/OS.

---

## Låsta beslut

| Beslut | Val | Inte |
|---|---|---|
| App | En Next.js 15 App Router-app, TypeScript strict | Multi-app, Turborepo, Woo/WP |
| Ytor | Route groups: `(public)` `(partner)` `(operations)` `(factory)` | Separata sajter |
| Data | Prisma 6 + SQLite i V1, Postgres-kompatibelt schema | Hårdkodade mock-arrayer i UI |
| Auth | Auth.js v5, credentials, DB-session | Clerk |
| Priser | Endast efter ÅF/Aqua-login via `priceVisibility` | Publika priser, factory-priser |
| Integrationer | Port + mock-adapter, `INTEGRATION_MODE=mock` | `import` av mock i `app/` / `src/ui/` |
| Studio 3D | CSS/canvas + 2–3 produktvinklar | Three.js-projekt i V1 |
| AI-studio | 100 % mock bakom `designAIService` | Riktig scraping/LLM i V1 |
| Språk | Svenska UI, `sv-SE` | Engelska som defaultspråk |
| Logo | Bifogad wordmark i hero och krom | Omritad CSS-logo |

**Hård regel:** Frontend importerar aldrig mockdata. ESLint `no-restricted-imports` mot `src/server/integrations/adapters/mock` och seed-JSON från `app/` och `src/ui/`.

---

## 1. Stack

- **UI:** Tailwind v4 + CSS tokens i `styles/tokens.css` (se §3)
- **Validering:** Zod i `src/domain/schemas`
- **Server:** Server Actions → services → repositories. Ingen `prisma.*` i UI.
- **Filer:** `FileStorage`-port, lokal disk i V1 (`storage/local`)
- **PDF:** `@react-pdf/renderer` (fraktsedel, mock-faktura, prislista)
- **Filter-URL:** `nuqs`
- **Typsnitt:** Inter 400/500/600/700
- **Alias:** `@/domain` `@/server` `@/ui` `@/actions`

Byt senare utan UI-omskrivning: SQLite → Postgres, lokal disk → S3/R2, `INTEGRATION_MODE=live` per adapter.

---

## 2. Mappstruktur

```
/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── (public)/ …
│   ├── (partner)/partner/ …
│   ├── (operations)/operations/ …
│   ├── (factory)/factory/ …
│   └── api/auth/[...nextauth]/route.ts
├── middleware.ts
├── src/
│   ├── domain/          entities, enums, schemas, policies/priceVisibility.ts
│   ├── server/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── rbac.ts
│   │   ├── repositories/
│   │   ├── services/
│   │   └── integrations/   types, composition.ts, adapters/mock, adapters/live
│   ├── ui/              tokens, public, shell, studio, tables
│   └── actions/
├── prisma/schema.prisma
├── prisma/seed.ts
├── styles/tokens.css
├── public/brand/aqua-visibility-logo.png
├── storage/local/
└── PLAN.md
```

---

## 3. Designsystem (Global CSS)

Känsla från bifogad studio-mockup + logotyp: ljust, luftigt, skandinaviskt B2B. En accent — logotypens blå.

### Tokens (implementera i `styles/tokens.css`)

```css
:root {
  --av-blue-500: #005CAF;   /* logo "aqua" + primär CTA */
  --av-gray-50:  #F9F9F9;   /* sidobakgrund */
  --av-gray-900: #171717;   /* body */
  --av-white:    #FFFFFF;
  --av-green-500: #16A34A;  /* klart */
  --av-yellow-500: #D97706; /* nästa åtgärd */
  --av-red-500:   #DC2626;  /* blockerad */
  --av-slate-500: #71717A;  /* ej påbörjat */
  --av-radius-md: 12px;
  --av-radius-lg: 16px;
  --av-font: "Inter", ui-sans-serif, system-ui, sans-serif;
}
```

Semantik: `--av-bg`, `--av-surface`, `--av-text`, `--av-accent`, `--av-status-done|next|blocked|idle`. Komponenter använder bara semantik, aldrig hex i JSX.

### Primitiver att bygga först

Button, Chip, Card, Panel, Table, Stepper, Timeline, Sidebar, Topbar, EmptyState, **Price (gated)**, StatusDot.

### Logo

Källa: `assets/WhatsApp_Image_2026-08-25_at_12.15.53-*.png` → `public/brand/aqua-visibility-logo.png`.

- Hero: full wordmark + bubbles, 120–160 px bred
- Header: 28–36 px höjd
- Favicon: bubble-kluster på `#005CAF`

### Förbjudet

Woo-grid, “lägg i varukorg”, publika priser, WordPress-menyer, zebra-tabeller, gradient-knappar, lekfull DTC-copy.

---

## 4. Routes (låsta)

### Publik — inga priser

| Path | Sida |
|---|---|
| `/` | Hero + USP + kategorier |
| `/produkter` | Kategoriindex |
| `/produkter/[category]` | Kategori |
| `/produkter/[category]/[product]` | Produktsida |
| `/designa` | Studio steg 1 |
| `/designa/[product]` | Studio från produkt |
| `/designa/ai` | AI-studio (mock) |
| `/inspiration` | Case |
| `/aterforsaljare` | ÅF-landning + lead |
| `/om` | Om Aqua |
| `/offert` `/offert/tack` | Offert |
| `/login` | Auth, redirect per roll |

Kategori-slugs: `profilvatten` `pappersmuggar` `energidryck` `sportflaskor` `ovriga-dryckesprodukter`.

Nav: Produkter · Designa själv · Inspiration · För återförsäljare · Om Aqua | Logga in | **Starta design**.

### ÅF `/partner`

`/` dashboard · `/priser` · `/priser/[productSlug]` · `/ordrar` · `/ordrar/[orderNo]` · `/ordrar/[orderNo]/repeat` · `/artwork` · `/dokument` · `/konto`

### Operations `/operations`

`/` vecka + undantag · `/pipeline` · `/ordrar` · `/ordrar/[orderNo]` · `/produktion` · `/etiketter` · `/ekonomi` · `/ekonomi/[orderNo]/fakturera` · `/ledning` · `/sok` · `/notiser`

### Factory `/factory`

`/` idag · `/jobb/[jobId]` · `/jobb/[jobId]/fraktsedel` · `/skickat` · `/dokument`

Login-redirect: RESELLER → `/partner`, STAFF/ADMIN → `/operations`, FACTORY → `/factory`.

---

## 5. Roller och prisvägg

| Roll | Ser priser | Skapar order | Produktion | Fakturering |
|---|---|---|---|---|
| Public | Nej | Offert (draft) | Nej | Nej |
| Reseller | Egen prislista | Ja + repeat | Status only | Egna fakturor (ej marginal) |
| Aqua Staff | Alla | Ja | Ja | Ja |
| Aqua Admin | Alla | Ja | Ja + admin | Ja + markera betald |
| Factory | **Aldrig** | Nej | Tilldelade jobb | **Aldrig** |

Andra linjen: DTO-projektioner. Factory-query får inte joina `PriceListItem` eller `Invoice`. Publik katalog-DTO strippar `unitPrice`. Tester: HTML för produktsida innehåller ingen `kr`-prisnod.

---

## 6. Datamodell

En modell. Fyra ACL-er. `Orders.currentStatus` är **projektion**. Sanning = `StatusEvents` (append-only).

**Tabeller:** Users, Companies, Resellers, Customers, Products, ProductVariants, PriceLists, PriceListItems, Orders, OrderItems, Designs, ArtworkFiles, ProductionJobs, Labels, Shipments, Documents, Invoices, StatusEvents, Notifications, Factories, Addresses.

**Prislistor:** `STANDARD` `SILVER` `GOLD` `SPECIAL`. Varje ÅF har exakt en. Resolve: högsta `minQty` där `qty >= minQty`. Inget fallback till Standard.

### OrderStatus (18 steg — spec §18)

```
ORDER_RECEIVED
ARTWORK_UPLOADED
ARTWORK_APPROVED
LABELS_ORDERED
LABELS_PRINTED
LABELS_SHIPPED_TO_FACTORY
LABELS_RECEIVED_BY_FACTORY
PRODUCTION_PLANNED
PRODUCTION_STARTED
BOTTLES_FILLED
LABELS_APPLIED
PRODUCTION_DONE
WAYBILL_CREATED
SHIPPED_TO_END_CUSTOMER
DELIVERED
READY_TO_INVOICE
INVOICED
PAID
```

Korrektur skickad / etikettfil skapad är **Design/Label-substatus** i eventloggen, inte extra OrderStatus.

### Tre maskiner under ordern

- **LabelStatus:** NOT_ORDERED → ORDERED → PRINTING → PRINTED → SHIPPED_TO_FACTORY → RECEIVED_BY_FACTORY
- **ProductionStatus:** NOT_PLANNED → PLANNED → STARTED → FILLING → FILLED → LABELING → LABELS_APPLIED → DONE
- **InvoiceStatus:** NOT_READY → READY → ISSUED → PAID

### Vem skriver vad

- ÅF: skapa order, upload artwork (t.o.m. `ARTWORK_UPLOADED`)
- Aqua: godkänn artwork, etikettbeställning t.o.m. skickad, planera produktion, fakturera
- Fabrik: etiketter mottagna, start → fylld → applicerad → klar, fraktsedel, skickad
- System: levererad (mock-tracking), redo att fakturera, betald (mock-Fortnox)

---

## 7. Yta för yta

### 7.1 Publik

Hero: logotyp + branded produktbild. Rubrik: *Ditt varumärke. På produkter människor faktiskt använder.* CTA: Starta din design / Se alla produkter. USP: Svensk produktion, Fyrfärgstryck, Flexibla upplagor, Personlig service, Snabba ledtider.

Produktsida visar MOQ, storlek, stilla/kolsyrat, flaska, kapsyl, etikett, tryck, ledtid, miljö, land — **inga priser**. CTA: Designa / Begär offert / Logga in för priser.

**Offert:** skapar `Order` (`source: public_quote`, draft) + `Design` (`submitted`) + `StatusEvent quote_requested`. Syns i Operations som ny offert. Publik ser aldrig belopp.

SEO: JSON-LD Product **utan** `offers`. Sitemap utan `/designa*` `/offert*` `/login`.

### 7.2 Design Studio

Två faser, samma `Design`:

1. Wizard: produkt → alternativ → antal → upload (PNG/JPG/SVG/PDF/AI)
2. Workspace (enligt mockup): header (projektnamn, undo/redo, spec, **Nästa**), vänsternav Design/Text/Upload/Colors/Bottle/Preview, 3D-mock + 2D-dieline, inspector (lager, placement, matte/gloss, AI-assist)

Steg 7: publik → Begär offert. ÅF → Lägg till i order (pris syns).

**V1 verkligt:** upload, 2D-canvas, persist, autosave.  
**V1 förenklat:** rotation via CSS/vinklar, etiketten följer.  
**V1 fake:** AI extract/proposals/refine. Märk *Simulerat*.

### 7.3 ÅF-portal

KPI: Aktiva / Väntar korrektur / I produktion / Skickade. Tabell med statuschips.

Priser per kvantitetssteg (270 / 540 / 1 080 / 2 500 / 5 000). Gold-session får inte Standard-rader.

**Repeat order (< 1 min):** prefill produkt, design, etikett, artwork, kund. ÅF väljer antal, datum, adress, samma artwork?. Ny `Order` med `sourceOrderId`.

ÅF ser kollapsad status (Mottagen · Korrektur · Produktion · Skickad · Levererad · Fakturerad). Samma events som ops 18-steg.

### 7.4 Operations

Inte CMS. Arbetsbord.

- **Idag:** veckomatris (flaskor × dag × storlek × stilla/kolsyrat) + “Behöver åtgärd idag”
- **Pipeline:** klickbara faskort
- **Order:** 18-stegs vertikal stepper + fem frågor (nu / måste / väntar / ägare / datum)
- **Produktion / etiketter:** gruppering och köfilter
- **Ekonomi:** redo / fakturerat / väntar betalning → mock-Fortnox
- **Ledning:** ordrar, flaskor, muggar, repeat %, snitt produktionstid
- **Sök:** ordernr, kund, ÅF, org.nr, tracking, fakturanr
- **Notiser:** samma exception-motor

Exception-regler (status + datum + SLA) är enda källan till tasks. En order försvinner aldrig — den byter fas eller avbokas.

### 7.5 Factory

Mobil/tablet-först. Grova 48 px-knappar. Kort, inte tabeller.

Kedja: Starta produktion → Markera klar → Skriv ut fraktsedel.

DTO: noll `unitPrice`, `orderValue`, `invoice`, `margin`. PDF-fraktsedel utan ekonomi.

---

## 8. Mock-integrationer

```
src/server/integrations/composition.ts   ← enda importpunkten
```

`getIntegrations()` läser `INTEGRATION_MODE` (`mock` | `live`). Live-adapters är `NotImplemented`-stubs.

| Port | Ansvar |
|---|---|
| `fortnoxService` | kund, faktura, skicka, betalstatus |
| `shipmentService` | fraktsedel, tracking, leverans (slutkund) |
| `labelService` | etikettorder, tryckstatus, tracking (till fabrik) |
| `factoryService` | externt fabriks-API (framtida). Portalen skriver via domain service. |
| `emailService` | bekräftelse, artwork, leverans |
| `designAIService` | logo, profil, Minimal/Bold/Event, refine |
| `notificationService` | in-app från domain events |

Varje mock: persistera rad → `StatusEvent` → ev. `Document` → notis. Latency 200–600 ms.

---

## 9. Demo-konton och seed

Lösenord (endast seed): `AquaDemo26!`

| E-post | Roll | Landar |
|---|---|---|
| `reseller.standard@demo.aqua` | ÅF Standard | `/partner` |
| `reseller.gold@demo.aqua` | ÅF Gold | `/partner` |
| `staff@demo.aqua` | Staff | `/operations` |
| `admin@demo.aqua` | Admin | `/operations` |
| `factory@demo.aqua` | Factory | `/factory` |

**Volym:** 20 fiktiva ÅF (Nordtryck AB, Skåneprofilen AB, Västkustreklam AB, …) · 30 slutkunder · 50 ordrar `AV-10450`–`AV-10499` · 4 prislistor · 2 fabriker (AquaFill Göteborg, AquaFill Örebro) · blandade statusar inkl. repeat ~40 %.

Inga riktiga bolagsnamn (inte Volvo/IKEA). Deterministisk seed (fast RNG).

---

## 10. Körordning (exekvering)

Specens prio 1–17 är produktvärde. Leveransordningen styrs av beroenden. **Prio 17 (mock-lager) körs först.**

### Fas 0 — Plattform (2–3 sessioner) · serial

1. Bootstrap Next.js, tokens, logo, tomma route-group layouts
2. Prisma-schema + seed (20/30/50)
3. Domain + repos + `getIntegrations()` + sex mock-ports
4. Auth.js + RBAC + demo-login + ESLint-gate

**DoD:** fyra tomma skal bakom rätt roll; `catalog.listProducts()` utan priser; UI importerar noll mock.

### Fas 1 — Publik + studio (3–4 sessioner) · efter Fas 0-contracts

5. Startsida, kategorier, produktsidor, om, inspiration
6. Offert → draft `Order`
7. Studio wizard + 2D-canvas + mockup-vinklar
8. AI-studio mock (`designAIService`)

**DoD:** noll priser i DOM; offert syns i ops-repo; studio skriver `Design`/`ArtworkFile`.

### Fas 2 — ÅF (3–4 sessioner) · parallellt med Fas 1 efter katalog

9. Dashboard KPI + ordertabell
10. Prislista per ÅF + leak-tester
11. Historik, filter, detalj, dokument
12. Repeat order < 1 minut

**DoD:** Gold ≠ Standard; repeat klonar design/etikett/adress.

### Fas 3 — Operations kärna (3–4 sessioner)

13. Orderdetalj 18-stegs stepper + event-timeline
14. Veckomatris + exception-motor
15. Pipelinekort + produktionstavla + etikettkö

**DoD:** “Behöver åtgärd idag” klickbar; events = sanning.

### Fas 4 — Factory (2 sessioner)

16. Idag-kort + CTA-kedja
17. Mock-fraktsedel PDF + skickat

**DoD:** noll `kr` i network-tab; öppningsbar PDF.

### Fas 5 — Ekonomi + dokument (2–3 sessioner)

18. Dokumenthylla (6 typer, versioner)
19. Slutför & fakturera → mock-Fortnox
20. Ekonomidashboard

**DoD:** fakturanr + event; factory ser inte finance-dokument.

### Fas 6 — Ledning + polish (1–2 sessioner)

21. Lednings-KPI + global sök + notiscenter
22. Responsiv QA (publik mobile-first, factory tablet, ops desktop)
23. DoD-spåret i §11

**Totalt ~16–22 sessioner.** Studio får inte blockera ÅF/ops. Factory får inte vänta på Fortnox. Ekonomi startar inte innan `StatusEvent` är enda sättet att flytta en order.

---

## 11. Definition of Done — “känns som en produkt”

En person kör detta utan att lämna appen:

1. Publik: hero → produkt (inga priser) → studio → Begär offert
2. Gold-ÅF: ser nettopris → repeat på < 1 min
3. Staff: samma order i pipeline → godkänn artwork → beställ etiketter
4. Factory (telefon/iPad): starta → klar → skriv ut fraktsedel — **inga priser**
5. Staff: Slutför & fakturera → ekonomi-KPI flyttar → ledning visar flaskor/repeat
6. `INTEGRATION_MODE=live` startar utan import-krasch
7. Grep: `app/**` importerar inte `adapters/mock`

På varje yta ska det synas: **Vad händer nu? Vad måste jag göra? Vad väntar vi på? Vem äger nästa steg? När ska det vara klart?**

---

## 12. Risker att vakta varje PR

- Prisleak i publik HTML/JSON/meta/JSON-LD
- Factory ser Invoice/PriceList via slarvig Prisma-include
- 3D-studio sväller till eget projekt
- AI-studio ser “äkta” ut utan *Simulerat*
- Två sanningar (`currentStatus` vs events) — events vinner
- Etikettfrakt (`labelService`) blandas med slutfaktfrakt (`shipmentService`)
- Demo-lösen i produktion
- Finance-dokument i factory-query

---

## 13. Första implementationskommando

När vi exekverar: börja **endast** med Fas 0. Inte sidbyggande före tokens, schema, ports och RBAC.

```
create-next-app (App Router, TS, Tailwind, ESLint)
→ tokens.css + logo
→ prisma schema + seed
→ integrations composition
→ auth + fyra skal
```

Därefter kan publik, studio, ÅF och ops-kärna köras som parallella workstreams mot samma contracts.
