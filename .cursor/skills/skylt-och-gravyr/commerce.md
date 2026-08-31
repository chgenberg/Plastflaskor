# Skylt — handel, pris, roller, produktion

Källrot: `/Users/christophergenberg/Desktop/Skyltochgravyr/skyltmotor/`

## Katalog

Produkter är **kod**, inte CMS-rader. En modul per typ under
`packages/catalog/src/products/` via `defineProduct`: Zod-schema, gränser,
export-capabilities (`engrave` / `print` / `dxf` / `stickerSheet`).

Material: `packages/catalog/src/materials.ts` + per-produkt-allowlist
`product-materials.ts`. Admin kan dölja/relabel via `CatalogSetting`
utan deploy.

Tillbehör (`Accessory`) är icke-designade SKU:er. Cart-rad:
`productType: "accessory"` + `{ accessoryId, name, unit }` i JSON.

Ny produkt = ny fil + registrering i `catalog/src/index.ts` +
`ProductType` i `@skylt/shared`. Inga hårdkodade listor i worker.

## Pris

Rena funktioner i `@skylt/pricing`. Dispatch:
`priceDocument(doc, tables, qty)` → produktformel
(`sign.ts`, `printed-sign.ts`, `sticker.ts`, `metal-cutting.ts`, …).

Märkskylt: area-tiers + tejp + lagerelement + teckenantal +
kategoriminimum. Runtime merge med `PriceOverride` i
`apps/web/src/server/pricing.ts`.

DB: `MaterialPriceTier`, `PriceTier`, `CharPrice`, `CategoryMinPrice`.

**Aldrig lita på klientpris.** Checkout kör `authoritativeUnitPrice`
(`apps/web/src/server/orders.ts`).

### Rabatter och avgifter

- `CustomerGroup` %-rabatt per produkt (`server/discounts.ts`)
- Referral-rabatt **stackar inte** med grupprabatt
- Ställkostnad (klistermärke, metallskärning)
- Minimibelopp: justeras upp, **blockerar inte** order
- Frakt i `lib/shipping.ts`

### Prisvisning (`server/vat-display.ts`)

| Aktör | Visning | Faktura |
|-------|---------|---------|
| Staff / utloggad | exkl. moms | nej |
| B2C (inget `Company.customerNo`) | inkl. moms | nej — bara kort/Swish |
| Verifierad B2B | exkl. moms (default) | ja, 30 dagar |
| Override | `Customer.showVatInclusive` | |

Lagrade belopp **alltid exkl. moms**. `vatAmount` räknas i kassan.
Designer multiplicerar visningen med 1.25 när inkl. moms.

Kundartikel med `agreedUnitPrice` hoppar över live-reprice och grupprabatt
(`isFixedPriceCartDocument`, `priceLocked`).

## Designer

UI: `apps/web/src/components/designer/sign-designer.tsx` (~11k rader —
**dela inte filen**). Skal: `designer-shell.tsx`. Batch/Excel:
`batch-studio.tsx`. Actions: `apps/web/src/app/skyltar/actions.ts`.

Användaren: välj produkt → material/mått/hål/lager → live SVG + live pris
→ spara mall (personlig eller företagsmall) → lägg i kundvagn.
Batch: CSV/Excel + nummerserie. Staff kan öppna en `orderItem` igen.

Persistens: `Design.document` JSON, ev. S3-thumbnail; kundsymboler som
data-URL; `CustomerProductDefault.settings`.

## Kundvagn och kassa

`server/cart.ts`. Cookie `sog_cart` (httpOnly). Inloggad kund claimar
gästvagn. Staff kan beställa åt kund (`admin-order-session.ts`).

Checkout (`createOrderFromCart`):

1. Validera + reprice varje rad
2. Auto-monteringstillbehör om kunden slagit på det
3. Grupp-/referral-rabatt, ställkostnad, min-order, frakt
4. Kräv orderetikett (`orderName` eller `customerPo`)
5. Skapa Order + OrderItem-snapshots; lös in bonus
6. Betalväg:
   - **Faktura** (verifierad B2B) — ingen Stripe; Fortnox vid skickad
   - **Kort/Swish** — Stripe Checkout
   - **Bara bonus** — direkt, ingen payment session
7. Bekräftelsemejl + PDF

Gästkassa: `/kassa`. Magic-link: `/order/[orderNo]`.
Ingen separat Quote-modell. Offertfrakt (`postnord-express`) = 0 i kassan,
staff sätter senare, bara faktura. Manuell offert = `OrderIntake`.

## Roller

**Staff** (`StaffUser`): `owner | admin | manager`  
Capability i `server/session.ts`:

- manager: ordrar, produktion, tillbehör
- admin: + CRM, katalog, innehåll, rapporter
- owner: + priser, verktyg

**Kund** (`Customer` på `Company`): `orderer | approver | viewer`  
Idag får **bara `orderer` beställa** (`customer-permissions.ts`).
Företagsmallar delas via `Design.companyId`.

**Gäst:** design + kassa utan konto; `guestEmail` på order.

## Produktion

Per rad: `server/production.ts` → gravyr-PDF, tryck-PDF, DXF, A4-ark →
S3 `productionFileKey`. Kundartiklar med extern Corel-fil hoppas över.

**Ark-nesting:** `lib/sheet-packing.ts` (ren algoritm).
Gruppering: `lib/production-workflow.ts`.
Persistens: `ProductionBatch` / `ProductionSheet` / `ProductionPlacement`.
UI: `components/admin/production/sheet-studio.tsx`.
Batch: draft → approved → exported → completed. Claimar enheter så
samma rad inte nestas två gånger.

Andra köer: tryckta skyltar, fiberlaser.

Vid **Skickad:** Sendify + Fortnox följesedel (+ faktura om fakturakund).
Orderpapper från snapshot: `lib/order-paper.ts`.

## Integrationer

| Tjänst | Roll | Nyckelfil |
|--------|------|-----------|
| Stripe | kort/Swish + webhook | `server/integrations/payments.ts` |
| Fortnox | kund, faktura, följesedel | `fortnox-oauth.ts`, `integrations/invoicing.ts` |
| Resend / SES | ut / in | `integrations/email.ts` |
| Sendify | fraktetikett + spårning | `integrations/shipping.ts` |
| S3 / Bedrock / Textract | filer, chatt, OCR | `storage.ts`, `assistant/`, `order-intakes.ts` |

Status: `/admin/integrationer`. Readiness: `lib/prod-readiness.ts`.
