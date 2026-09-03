# `src/domain/` — ren TypeScript

Motsvarar Skylts `packages/{engine,catalog,pricing,shared}`.
Ingen React, ingen Next, inga Prisma-anrop, inga secrets.

Hit hör Zod-scheman, policies (`canSeePrices`, `canSeeFinance`), enum,
org.nr, prislistnamn, orderbrief, cup/visual-dokument.

`import type` från `@prisma/client` (t.ex. `Role`) är tillåtet.
Tester ligger bredvid källan som `*.test.ts`.
