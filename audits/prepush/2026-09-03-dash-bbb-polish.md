# Pre-push hunt — dashboard-yta + header/config

Scope: working tree mot `origin/main` (18 filer). 2026-09-03.

## CRITICAL (must fix before push)

Inga.

## HIGH (should fix before push)

Inga.

## MEDIUM (can fix in follow-up)

- `src/ui/product/ProductConfigurator.tsx:187` — `Minst {moq} st` renderas även när `canSeePrices` är false. `no-public-prices` nämner `minQty`. Fanns före diffen; raden flyttades. Gata bakom `canSeePrices` eller skriv “minsta antal visas när du skapar konto”.
- `src/ui/product/ProductConfigurator.tsx:176` — antal-fältet har ingen `aria-label` / kopplad `<label>`. Stegknapparna har label; själva inputen inte.
- `src/ui/product/ProductConfigurator.tsx:192` — `role="radiogroup"` med `aria-pressed`-knappar, inte `role="radio"`. Skärmläsare får en halv grupp.

## OK — verified correct

- Publik prisvägg: `canSeePrices` i produktsidan och konfiguratorn. Anonym ser “Pris visas när du skapar konto”. JSON-LD utan `offers`. Inga `kr` i publik DTO. `contract #1`.
- `capLabel` / visual spec orörd. Shop-labels är egna funktioner + test.
- Fabriksknappar i `LabelJobsTable` / `BottlerJobsTable` / `SendToPrinterButton` fortfarande `lg` (48 px).
- Etikett/bottler-ytor orörda för invoice/`kr`. `contract #2`.
- `NeedsAttention` är client-ö med `type="button"` + `aria-expanded`. Tom lista → `null`.
- Topbar/tabbar `display:none` från 1024 px, så SK-avataren inte längre täcker sidhuvudknappen.
- Inga mock-imports, inga hemligheter i client, Prisma 6 orörd.

**Sammanfattning:** Inga blocker funna — OK att pusha.
