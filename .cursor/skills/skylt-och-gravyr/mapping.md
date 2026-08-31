# Skylt → Aqua / pappmuggar

Aqua Visibility OS (det här repot) är **syskonet**. Samma OS-idé:
produkt → design → order → produktion → leverans → faktura.
Sortimentet ska bli **framförallt pappmuggar**. Word-dokumentet som
kommer senare är deltalistan. Den här filen är analogin — inte
implementationsordern.

## Ytor

| Skylt | Aqua idag | Kommentar |
|-------|-----------|-----------|
| Publik `/` | `(public)/` | Marketing + katalog. Aqua: **inga publika priser**. Skylt visar B2B-exkl. moms även utloggad. |
| Designer `/skyltar` + produkt-slug | `(studio)/designa` | Samma jobb: bygg dokumentet som blir sanningen. Aqua har GPT Image + reality-preview — behåll som extra, ersätt inte Skylts dokumentmodell. |
| `/kassa` | `/kassa` | Finns redan. Skylt: gästcookie + server-reprice. |
| `/konto/*` | `/partner/*` | Skylt = slutanvändande B2B-företag. Aqua = **återförsäljare** (Standard/Gold). Inte 1:1. |
| `/admin/*` | `/operations/*` | Orderboard, CRM-ish, ekonomi. |
| `/admin/produktion/*` | `/factory/*` | Skylt: staff nestar ark. Aqua: extern fabrik med egen inloggning. |
| — | ÅF Gold vs Standard | Finns inte hos Skylt. Prislista per resellerId. Får inte läcka. |

## Roller

| Skylt | Aqua |
|-------|------|
| `owner / admin / manager` | `AQUA_ADMIN / AQUA_STAFF` |
| `Customer` på `Company` (`orderer`) | `RESELLER` (tier Gold/Standard) |
| — | `FACTORY` (separat yta, ser aldrig ÅF-priser/fakturor) |
| Gäst som designar | Publik studio/kassa utan ÅF-login |

Skylts `approver/viewer` är i schemat men inte live. Kopiera inte
förrän Word-dokumentet ber om det.

## Domänobjekt

| Skylt | Tänk hos oss |
|-------|----------------|
| `SignDocument` (mm, lager) | Ett **MugDocument** / wrap-dokument: samma JSON till preview, pris, order, tryckfil. Inte tre modeller. |
| `ProductType` + `defineProduct` | Produktregistry: pappmugg (storlek, dubbelvägg, lock), ev. flaska/etikett som extra. |
| Material (gravyrplast, Al, vinyl) | Material/finish för mugg: pappvikt, coating, tryckyta. |
| Kundartikel + `agreedUnitPrice` | ÅF-avtalad SKU / repeat-order. Aqua har redan `/partner/ordrar/…/repeat`. |
| Företagsmall | ÅF-mall / brand kit. |
| Ark / `ProductionSheet` | Tryckark / gang-run för muggar — **bara om Word-dokumentet säger det**. Annars fabrikskedja som idag. |
| Ställkostnad | Setup / kliché / minimiorder för tryck. |
| Inkommande (mejl/OCR) | Offert-inbox. Aqua har `/offert` — håll isär från kassa tills dokumentet säger annat. |

## Pris — viktig skillnad

Skylt: B2B-sajt, **visa pris** (exkl. moms default), grupprabatt, live i
designern.

Aqua (låst idag): **inga numeriska publika priser**. Pris efter ÅF-login
via `priceVisibility`. Gold ≠ Standard. Fabrik ser aldrig ÅF-pris.

När Word-dokumentet kommer: ändra visningsregler där — **inte**
kontraktet "servern är sanningen" och "snapshot är immutabelt".

## Flöden som ska kännas likadana

1. Designern bygger **ett** dokument.
2. Live-pris från rena funktioner + DB-tiers (synligt bara för den som
   får se pris).
3. Lägg i kundvagn → server validerar schema + katalog + pris.
4. Kassa repriserar allt utom avtalad rad.
5. Order fryser dokument + pris.
6. Produktion/fabrik läser snapshot.
7. Skickad triggar frakt + ev. Fortnox.

## Vad Aqua redan har som Skylt inte har

- ÅF-tier (Gold/Standard) och prislistor per reseller
- Separat fabriksinloggning och kedja Mottag → Starta → Fylld → Etikett
  → Klar → Fraktsedel → Skickad
- GPT Image-compose + "se i verkligheten"
- Publik copy låst mot aquavisibility.se
- Demo-lösen `AquaDemo26!`
- Railway + SQLite V1 (Skylt = SST/AWS + Postgres)

**Ta inte bort** `/kassa` eller GPT-studio bara för att Skylt saknar dem.
Word-dokumentet styr delta.

## Vad Skylt har som Aqua saknar (kandidater — vänta på Word)

- Registry-driven produktkatalog + Zod per typ
- Ren `@pricing`-motor med admin-overrides utan deploy
- Gästvagn-cookie + claim vid login
- Företagsmallar + kundartiklar med låst pris
- Auktoritativ checkout-reprice
- Produktionsfil per rad (PDF/DXF) från samma dokument
- Ark-nesting / batch
- Fortnox live (Aqua har port + mock)
- Intake-kö för mejl/filer
- Bonus / värvning
- Staff-beställning åt kund
- i18n `/en`

## Källkod att öppna när du implementerar (inte nu)

Rot: `/Users/christophergenberg/Desktop/Skyltochgravyr/skyltmotor/`

Ändra **aldrig** den koden utan att användaren explicit ber om det.
Det här repot är Par_tryckeri.

## När Word-dokumentet kommer

1. Läs dokumentet som **delta mot SKILL.md + den här kartan**.
2. Varje punkt: "behåll Skylt-kontrakt" / "byt sortiment" / "byt yta".
3. Implementera i Aqua-stacken (en Next-app, Prisma 6, Tailwind v4,
   Auth.js, Railway) — **importera inte** `skyltmotor/` som paket.
4. Kopiera mönster, inte 11k-raders `sign-designer.tsx`.
