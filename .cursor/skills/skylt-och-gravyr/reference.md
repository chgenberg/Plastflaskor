# Skylt och gravyr — referens

**Rot:** `/Users/christophergenberg/Desktop/Skyltochgravyr`  
**Kod:** `skyltmotor/`  
**Kund:** Skylt & Gravyrteknik AB, Göteborg  
**Live dev:** https://d17djn28sybbd.cloudfront.net

## Stack

| Lager | Val |
|-------|-----|
| App | Next.js 15.1 App Router, React 19, TS strict |
| Monorepo | pnpm 9 + Turborepo |
| DB | Postgres (Aurora Serverless v2 prod; lokal Docker :5546) |
| ORM | Prisma i `@skylt/db` |
| Auth | Auth.js v5 credentials + bcrypt, JWT. Roller: `owner \| admin \| manager \| customer` |
| UI | Tailwind 3 + tokens från `@skylt/ui` |
| Betalning | Stripe (kort/Swish) + B2B-faktura 30 dagar via Fortnox |
| E-post | Resend (ut) / SES (inkommande order) |
| ERP | Fortnox OAuth |
| Frakt | Sendify |
| AI | AWS Bedrock (chatt + veckorapport) |
| OCR | Textract på inkommande filer |
| Filer | S3 + CloudFront |
| Jobs | SQS + Lambda (PDF/DXF) |
| Hosting | SST v3, OpenNext på Lambda, `eu-north-1` |

Lokal start: `cd skyltmotor && pnpm install && docker compose up -d` sedan seed + `pnpm --filter @skylt/web dev`.

## Monorepo

```
skyltmotor/
├── apps/web/          @skylt/web — enda Next-appen
├── packages/
│   ├── engine/        SignDocument, SVG, autosize
│   ├── catalog/       produkter, material, symboler
│   ├── pricing/       rena prisfunktioner
│   ├── production/    PDF/DXF + worker
│   ├── intake/        mejl/fil-intag
│   ├── db/            Prisma + seed
│   ├── shared/        ProductType, order-enum
│   └── ui/            tokens, inga React-komponenter
├── infra/             SST
└── qa/                Playwright-personas + vandring
```

DAG: `apps/web` är enda stället med React, Prisma-anrop och secrets.
`engine`/`production` får inte importera `catalog` (utom `worker.ts`).
Domänpaket får inte importera `next`/`react`.

## Ytor och routes

### Publik
`/`, `/om-oss`, `/vad-vi-gor`, `/kontakt`, `/fragor-och-svar`, `/produkter`,
`/nyheter`, `/nyheter/[slug]`, `/bransch`, `/bransch/[slug]`,
`/integritetspolicy`, `/cookies`, `/villkor`, `/logga-in`, `/registrera`,
`/verifiera-epost/[token]`, `/valj-losenord/[token]`.  
Engelska CMS: `/en/…` via middleware.

### Designer (gäst + inloggad)
Hub: `/skyltar`. Query: `?design=` `?cartItem=` `?orderItem=` `?product=`.

| URL | ProductType |
|-----|-------------|
| `/skyltar` | `sign` |
| `/ventilbrickor` | `valve-tag` |
| `/haklappar` | `bib-tag` |
| `/nodstopp` | `emergency-stop` |
| `/linjal` | `ruler` |
| `/kabelmarkning` | `cable-marker` |
| `/praglad-kabelmarkning` | `embossed-cable-marker` |
| `/laser-kabelmarkning` | `laser-cable-marker` |
| `/ledningsmarkning` | `wire-marker` |
| `/plintmarkning` | `terminal-marker` |
| `/wml-dekaler` | `wml-decal` |
| `/krympslang` | `heat-shrink` |
| `/metallskarning` | `metal-cutting` |
| `/tryckta-skyltar` | `printed-sign` |
| `/klistermarken` | `sticker` |
| `/rormarkning` | `pipe-marker` |
| `/rormarkning-fara` | `hazard-pipe-marker` |
| `/faropiktogram` | `hazard-pictogram` |
| `/taktil-skylt` | `tactile-sign` (kan vara dold) |
| `/vagmarken` | `road-sign` (kan vara dold) |
| `/tillbehor` | accessory-shop, inte designer |

### Kassa
`/kassa`, `/checkout/[orderNo]`, `/checkout/[orderNo]/klar`,
`/order/[orderNo]` (gäst magic-link).

### Kundportal `/konto/*`
profil, företag, adresser, kundvagn, mallar, artiklar, ordrar, historik,
bonus, automatiseringar, integritet.

### Admin `/admin/*` (`requireStaff`)
ordrar, historik, kundvagnar, produktion/batch/tryck/fiberlaser,
kunder, företag, kundgrupper, väntande konton, kundartiklar,
företagsmallar, prislistor, katalog, tillbehör, värvning,
inkommande, personal, integrationer, innehåll, testfiler.

## SignDocument

`packages/engine/src/types.ts`. Allt i mm, center-ankrat.
Lager: text (rader, ev. båge), symbol, bild, QR, ram, rect, line.
Plus montering, hål, produkt-block (plint-grid, markörremsor).

Samma JSON → SVG-preview, `priceDocument()`, `CartItem.document`,
`OrderItem.document`, gravyr-PDF / tryck-PDF / DXF.

Produktionsfärger (heliga): röd `#FF0000` = skär, blå `#0000FF` = hål,
svart `#000000` = gravyr. DXF: CUT=1, DRILL=5, ENGRAVE=7.

## Datamodell (Prisma)

**Identitet:** `StaffUser`, `Customer`, `Company`, `CustomerGroup`, `Address`  
**Katalog/pris:** `Product`, `Material`, `MaterialPriceTier`, `PriceTier`,
`PriceOverride`, `CatalogSetting`, `Accessory`  
**Design:** `Design`, `CustomerSymbol`, `Template`, `NumberSeries`,
`CustomerProductDefault`  
**Handel:** `Cart`/`CartItem`, `Order`/`OrderItem` (snapshots),
`OrderStatusEvent`  
**Produktion:** `ProductionBatch`, `ProductionSheet`, `ProductionPlacement`  
**Intake:** `OrderIntake` + Textract  
**Övrigt:** Fortnox-koppling, CMS `ContentEntry`, bonus/värvning,
legacy-tabeller (read-only)

## Orderstatus

Lagrade koder: `draft submitted in_review in_production completed shipped delivered cancelled`.

Synliga lanes: **Aktiv → Mottagen → Tillverkning → Skickad** (+ Makulerad).
`in_review` visas som Mottagen; `completed`/`delivered` som Tillverkning/Skickad.

Betalning: `invoice` | `card` | `swish`. Status: unpaid/pending/paid/refunded/failed.

## Glossary

| Term | Betydelse |
|------|-----------|
| skyltmotor | In-browser designmotor + hela OS:et |
| gravyr | Lasergravering i 2-skiktsplast/metall |
| ark | A4-nesting eller `ProductionSheet` |
| batch / produktionsorder | Ark-layout, t.ex. `2026-001` |
| företagsmall | Design synlig för hela bolaget |
| kundartikel | Avtalad SKU med `agreedUnitPrice` |
| nummerserie | Auto-inkrement för batchmärkning |
| kundgrupp | B2B-grupp med %-rabatt |
| ställkostnad | Orderavgift (klistermärke, metallskärning) |
| inkommande | Mejl/fil-intake som människa godkänner |
| orderpapper / fraktsedel | Verkstadsunderlag / sändningsetikett |
| bonus / värvning | Tillgodohavande / referral |

## Docs i Skylt-repot

| Fil | Använd |
|-----|--------|
| `skyltmotor/ARCHITECTURE.md` | Kanonisk DAG + 12 kontrakt |
| `docs/utvecklarhandbok.md` | AWS, deploy, tunnel, legacy |
| `docs/funktionsspec.md` | Krav (Lovable reverse-eng) |
| `docs/designer-ux-spec.md` | Designer-UX |
| `docs/byggplan.md` | Delvis inaktuell — lita på ARCHITECTURE |
| `apps/web/src/app/README.md` | Route-karta |

Inget `AGENTS.md` / root-`PLAN.md`.

## Seed / QA

Lösenord via env, aldrig i skillen: `SEED_ADMIN_PASSWORD`,
`SEED_CUSTOMER_PASSWORD`. Staff `admin@skyltochgravyr.com`, kund
`demo@kund.se` (Demo Industri AB). Gäst behöver inget konto; cookie
`sog_cart`.
