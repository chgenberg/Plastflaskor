---
name: skylt-och-gravyr
description: >-
  Source-of-truth knowledge of Skylt och Gravyrteknik (skyltmotor) —
  the sibling B2B design-to-order OS that Aqua Visibility / pappmuggar
  should clone logically. Use whenever implementing or changing catalog,
  designer, studio, cart, checkout, pricing, orders, production, factory,
  partner portal, kundartiklar, mallar, Fortnox, or when the user mentions
  Skylt, gravyr, skyltmotor, pappmuggar, Word-dokument, kopiera från Skylt,
  liknande projekt, or adapting this repo toward paper cups.
---

# Skylt och gravyr — bakgrundsintelligens för det här projektet

Det här repot (Aqua Visibility OS / Par_tryckeri) ska **logiskt spegla**
Skylt och Gravyrteknik. Kunden är en annan, sortimentet blir **framförallt
pappmuggar**, men OS-mönstret är detsamma: design → auktoritativt pris →
kundvagn → order-snapshot → produktion → frakt/faktura.

**Källkod (read-only tills användaren säger annat):**
`/Users/christophergenberg/Desktop/Skyltochgravyr`

**Produkten där:** `skyltmotor/` (pnpm + Turborepo). Kanonisk karta:
`skyltmotor/ARCHITECTURE.md`.

## Låst tills Word-dokumentet kommer

Användaren skickar senare ett Word-dokument med **exakt** vad som ska
ändras från Skylt → pappmuggar/Aqua. Tills dess:

1. **Skriv inte om Aqua till att vara Skylt.** Bygg inte en skyltmotor-klon
   i det här repot på eget bevåg.
2. **Använd Skylt som facit** när du designar, förklarar eller jämför.
   Om något i Aqua strider mot ett Skylt-kontrakt: flagga det, kopiera
   inte slarvigt.
3. När Word-dokumentet kommer: läs det som **delta mot den här skillen**,
   inte som en ny produkt från natt och dag.

## Vad du ska göra när skillen är relevant

1. Läs den här filen färdigt.
2. Läs rätt referens (en nivå, inte alla på en gång):
   - Arkitektur, ytor, glossary, datamodell → [reference.md](reference.md)
   - Katalog, pris, kundvagn, kassa, roller → [commerce.md](commerce.md)
   - Skylt ↔ Aqua/pappmuggar-karta → [mapping.md](mapping.md)
3. Om du ska **implementera** ett mönster: öppna källfilen i
   `Skyltochgravyr/skyltmotor/` som referensen pekar på. Gissa inte API:er.
4. Svara på svenska om användaren skriver svenska.

## Heliga kontrakt (kopiera dessa, inte UI-pixlar)

Samma 12 som Skylts pre-push, översatta till det här OS:et:

1. **Ett JSON-dokument är sanningen.** Hos Skylt: `SignDocument` (mm,
   lager). Samma struktur driver preview, pris, kundvagn, order-snapshot
   och produktionsfil. Hos oss: motsvarande wrap/etikett/mugg-dokument
   — inte tre parallella modeller.
2. **Pris är server-auktoritativt.** `priceDocument(doc, tables, qty)`
   är rena funktioner. Klientens `unitPrice` litas aldrig på. Checkout
   **reprisar alltid** (undantag: avtalad kundartikel).
3. **Ordersnapshots är immutabla.** `OrderItem.document` + `unitPrice`
   fryses vid order. Produktion läser snapshot, inte live-designern.
4. **Kundvagn är cookie-scoped** (`sog_cart` hos Skylt). Aldrig item-id
   ensamt som ägarskap.
5. **Produkter är registry-drivna** (`defineProduct` + `getProduct`).
   Inga hårdkodade produktlistor i export/worker.
6. **Domänpaket är rena.** Engine/pricing/production importerar inte
   React, Next eller Prisma. Bara web-appen rör secrets.
7. **Auth:** bcrypt, staff före kund, bara aktiva konton.
8. **Produktionsfiler är IDOR-skyddade.** Session krävs; kund ser bara
   egna filer.
9. **Enheter:** geometri i mm; pengar i SEK. Moms-display är UI; lagrade
   belopp är exkl. moms.
10. **Integrationer bakom port + mock.** Dev kör hela flödet utan live-nycklar.
11. **`server-only`** på serverlager. Klient får `import type`.
12. **Bilduppladdning:** PNG/JPEG, storlekstak; en trasig bild hoppas
    över, inte hela jobbet.

## Flödet att ha i huvudet

```
Katalog (kod) + priser (DB-tiers/overrides)
        ↓
Designer bygger dokument → live priceDocument()
        ↓
Kundvagn: snapshot + unitPrice  [server validerar]
        ↓
Kassa: reprice, tillbehör, rabatt, avgift, frakt
        ↓
Order + OrderItem (immutabla snapshots)
        ↓
Betalning: kort (Stripe) | faktura 30 dagar (Fortnox) | bonus
        ↓
Produktion: fil per rad; ev. ark-nesting (batch)
        ↓
Skickad: fraktetikett + följesedel (+ faktura)
```

## Ytor hos Skylt (en Next-app)

| Yta | Prefix | Vem |
|-----|--------|-----|
| Publik + CMS | `/`, `/en/…` | gäst |
| Designer | `/skyltar` + produkt-slug | gäst + inloggad |
| Kassa | `/kassa`, `/checkout/…` | gäst + kund |
| Kundportal | `/konto/*` | kund |
| Admin + produktion | `/admin/*` | staff (`requireStaff`) |

Designer är **inte** en separat app. Hubben är `/skyltar`.
Produktion är **inte** en separat app. Den sitter under `/admin/produktion/*`.

## Vad Skylt säljer (inte muggar)

Industriell märkning och gravyr: märkskylt, ventilbricka, haklapp,
kabelmärkning, plint, rörmärkning, tryckt skylt, klistermärke,
metallskärning, tillbehör. Material: gravyrplast, eloxerad Al, rostfritt,
vinyl, osv.

**Pappmuggar är Aquas sortiment.** Skylts produktkatalog kopieras inte
verbatim — mönstret (registry + Zod + export-capabilities) kopieras.

## När du ska slå upp källkod

| Jag vill förstå… | Öppna |
|---|---|
| Paket-DAG / heligt | `skyltmotor/ARCHITECTURE.md` |
| `SignDocument` | `packages/engine/src/types.ts` |
| Produktregistry | `packages/catalog/src/products/` + `packages/shared/src/product-type.ts` |
| Prismotor | `packages/pricing/src/dispatch.ts` |
| Designer-UI | `apps/web/src/components/designer/sign-designer.tsx` (dela inte filen) |
| Kundvagn | `apps/web/src/server/cart.ts` |
| Order + reprice | `apps/web/src/server/orders.ts` |
| Moms/prisvisning | `apps/web/src/server/vat-display.ts` |
| Roller | `apps/web/src/server/session.ts` |
| Produktion PDF/DXF | `packages/production/` |
| Ark/batch | `apps/web/src/lib/sheet-packing.ts`, `src/server/production-batches.ts` |
| Prisma | `packages/db/prisma/schema.prisma` |

Rör **aldrig** `skyltmotor/` utan explicit order. Skylt-repot har
`skyltmotor-locked.mdc`.

## Inte byggt i Skylt (lita inte på att det finns)

- Formell attest-kedja (`approver` finns i schema, bara `orderer` får beställa)
- Fristående offert-entitet (offert = intake + manuella rader + offertfrakt)
- Taktil skylt / vägmärke kan vara dolda i katalogen

## Extra läsning

- [reference.md](reference.md) — stack, routes, datamodell, glossary
- [commerce.md](commerce.md) — katalog, pris, kassa, roller, integrationer
- [mapping.md](mapping.md) — Skylt-begrepp → Aqua-ytor / pappmuggar
