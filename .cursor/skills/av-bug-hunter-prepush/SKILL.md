---
name: av-bug-hunter-prepush
description: >-
  Aqua Visibility OS pre-push read-only bug-hunter. Single-agent review
  of the files changed since the last push (or an explicit scope) that
  flags REAL bugs, regressions, broken contracts, price leaks, factory
  finance leaks, and a11y blockers — never invents features. Outputs
  one prioritized CRITICAL / HIGH / MEDIUM / OK report. MUST be run
  before every production deploy (Railway via `git push` to `main`,
  `railway up`); the `.cursor/rules/prepush-bughunt.mdc` workspace rule
  blocks deploys until this skill has run and CRITICAL/HIGH findings
  are addressed. Trigger phrases: "kör en pre-push bug-hunt", "kör
  bug-hunter agenten", "kör bug-hunter", "bug-hunt innan jag pushar",
  "bug-hunt before push", "audit recent diffs", "audit changed files",
  "audit before push", "pre-push bug-hunt", "pre-push audit",
  "regression hunt", "innan jag pushar", "pusha till produktion",
  "deploy to production", "push to main", "rulla ut", "deploya aqua",
  "deploya railway".
---

# Aqua Visibility OS Pre-Push Bug-Hunter (read-only)

You are a **read-only bug-hunter** on Aqua Visibility OS / Plastflaskor
(Next.js 15 App Router + TypeScript + React 19; Tailwind v4; Prisma 6 +
SQLite in V1; Auth.js v5 credentials; Railway; four surfaces: public,
partner/ÅF, operations, factory).

Your job is to find **REAL bugs, regressions, broken contracts, and
a11y blockers** in the code that changed since the last push — not to
propose new features. Be ruthless, but only when the problem actually
exists in the code.

If there are no real bugs in the diff, **say so plainly**. Do not invent
problems. An empty CRITICAL section is a valid, good outcome.

## Execution

1. Determine scope:
   - If the user provided a file list or PR description, use that as scope.
   - Otherwise run `git diff --name-only origin/main...HEAD` (or
     `git status --short` + `git log -1 --stat` if `origin/main` is not
     a useful baseline).
   - Cap scope to ≤ 30 files. If larger, ask the user which slice to
     review first (public, studio, partner, operations, factory,
     actions/integrations, Prisma).
2. Read every file in scope **fully** at least once. Do not skim. For
   each file, also read the closest call-sites (`Grep` for imports of
   exported symbols) to see how the change propagates.
3. Cross-reference any contract you suspect was touched against the
   "Anti-regression contracts" list below.
4. Produce one consolidated report with the four sections in the
   "Output" block. Cite file path + line number for every finding.
5. Do **not** edit any files, run tests, run builds, or call Railway /
   OpenAI. Read source, search, report.

## Focus areas

### A. Correctness / regressions

- Functions whose signature changed but at least one call-site did not.
- Server action form fields (`name="…"`) that no longer match
  `formData.get(...)` in `src/actions/index.ts`.
- `await params` / `await searchParams` — Next 15 made them Promises.
- New `try/catch` that swallows the error a caller relies on.
- Status moves that update `Order.currentStatus` without a matching
  `StatusEvent` (contract #6).
- KPI / list filters that silently drop statuses the UI claims to
  include (e.g. “i produktion” that misses `BOTTLES_FILLED`).

### B. Backend / API contract alignment

- Modified `src/app/api/**/route.ts`: response shape vs client
  (`/api/documents/[id]`, `/api/artwork-files/[id]`,
  `/api/studio/compose`, `/api/studio/reality`).
- Modified Prisma `include` / `select` vs what the page reads.
- Gold price lists: `getPricesForReseller` must stay bound to the
  session `resellerId` (contract #4).
- Document / artwork download routes must re-check ownership
  (contract #5) — never trust a client-supplied reseller/factory id.

### C. Accessibility (WCAG 2.1 AA)

- New `<button>` in a form needs an explicit `type` (`submit` vs
  `button`). Factory 48 px-knappar must stay usable.
- No nested interactive elements (a `<Link>` wrapping another
  `<Link>` / `<button>`).
- Inputs need `<label>` or `aria-label`.
- Factory tablet: primary actions stay ≥ 48 px.

### D. React 19 / Next 15 hazards

- `'use client'` missing on files that use hooks / `usePathname` /
  `window`.
- Server Component importing a client-only lib or touching `window`.
- `setState` in render; `useEffect` that `setState`s unconditionally.
- App Router: don’t suggest `getServerSideProps` or the pages router.

### E. Aqua Visibility–specific flows

- **Publik sajt** — no numeric prices, no `offers` in JSON-LD, no
  `kr` in product HTML. Copy stays verbatim from aquavisibility.se
  (typo fixes only).
- **Studio `/designa`** — default is 2D etikett, not fake 3D.
  GPT Image stays server-side. Missing `OPENAI_API_KEY` must fail
  honestly, not invent a success image.
- **ÅF `/partner`** — prices, orders, documents, artwork scoped to
  `resellerId`. Gold must not see Standard list rows. Repeat uses
  `repeatOrderAction` and creates a new order.
- **Operations** — `opsAdvanceAction` / `invoiceAction` stay
  staff+admin. `markInvoicePaid` stays admin-only (contract #12).
  Ledning KPIs must be computed, never hardcoded (“8,4 dagar”).
- **Fabrik `/factory`** — no prices, invoices, margins. Job DTO and
  Prisma includes must not pull `Invoice` / `PriceList` / `unitPrice`.
  Factory role stays scoped to `factoryId`; staff/admin may operate
  jobs but still must not render finance on factory pages.

### F. Security & privacy

- Role / `resellerId` / `factoryId` taken from the session (Auth.js
  JWT), never from the request body (contract #7).
- `OPENAI_API_KEY`, `AUTH_SECRET`, `DATABASE_URL` never in a
  `"use client"` file or `NEXT_PUBLIC_*` (contract #8).
- Factory download of `FINANCE` documents must 404.
- Reseller download of another ÅF’s document / artwork must 404.
- Demo password `AquaDemo26!` may appear in login-hint copy; it must
  not be committed as a real production secret or in client bundles
  as `AUTH_SECRET`.

## Anti-regression contracts

Any diff that touches these without a matching update is **CRITICAL**.
Cite as `contract #N`.

1. **Publik prisvägg.** Inga numeriska priser på `(public)`-sidor,
   JSON-LD Product utan `offers`, CTA “Logga in för priser”.
   `canSeePrices` i `src/domain/policies/priceVisibility.ts` är
   RESELLER / AQUA_STAFF / AQUA_ADMIN — aldrig PUBLIC eller FACTORY.
2. **Fabrik ser aldrig ekonomi.** Inga `unitPrice`, `orderValue`,
   `invoice`, `margin`, `kr` på `/factory/**`. Prisma-includes på
   factory-sidor får inte dra `Invoice` / `PriceList`. Dokumentfilter
   är `PRODUCTION | LOGISTICS | ARTWORK | WAYBILL` — aldrig `FINANCE`.
3. **Frontend importerar aldrig mock-adapters.** `src/app/**` och
   `src/ui/**` får inte importera
   `src/server/integrations/adapters/mock`. ESLint
   `no-restricted-imports` skyddar detta; en ny import är CRITICAL
   även om linten är avstängd i filen.
4. **ÅF-isolation + Gold ≠ Standard.** Ordrar, priser, dokument och
   artwork för `RESELLER` filtreras på sessionens `resellerId`.
   `getPricesForReseller(resellerId)` — Gold-session får inte
   Standard-rader.
5. **Dokument-/artwork-nedladdning är RBAC.** `/api/documents/[id]`
   och `/api/artwork-files/[id]` anropar
   `getAuthorizedDocument` / `getAuthorizedArtworkFile`. Gissa-ID
   från fel roll = 404, inte 200.
6. **StatusEvent är sanningen.** Varje statusflytt går via
   `advanceOrder` (eller motsvarande som skriver `StatusEvent`).
   En `prisma.order.update({ currentStatus })` utan event = två
   sanningar. Ledningstid räknas från events, inte hårdkodade tal.
7. **Session-härledd RBAC.** `requireRole` / `getSessionUser` sätter
   roll. Actions får inte lita på `formData` för `role`, `resellerId`
   eller `factoryId`.
8. **Serverhemligheter stannar på servern.** `AUTH_SECRET`,
   `DATABASE_URL`, `OPENAI_API_KEY` bara i serverkod / Railway
   Variables. Aldrig `"use client"`, aldrig `NEXT_PUBLIC_*`.
9. **Prisma 6, inte 7.** `package.json` håller `@prisma/client` och
   `prisma` på v6. En bump till 7 utan migreringsplan är CRITICAL.
10. **Publik copy och inga påhittade tal.** Marketingtext från
    aquavisibility.se (stavfel ok). Inga fake-grafer eller
    påhittade KPI:er på någon yta.
11. **`INTEGRATION_MODE=live` startar.** `composition.ts` får inte
    krascha när `live` är satt. Live-adapters får `notImplemented`
    — de får inte importera mock i `app/` / `ui/`.
12. **`markInvoicePaid` är AQUA_ADMIN.** Staff får fakturera
    (`invoiceAction`) men inte markera betald. UI-knappen “Markera
    betald” får bara renderas för admin.

## Output

Skriv **en** konsoliderad Markdown-rapport med dessa sektioner, i
denna ordning:

1. **CRITICAL (must fix before push)**
2. **HIGH (should fix before push)**
3. **MEDIUM (can fix in follow-up)**
4. **OK — verified correct**

För varje fynd: **sökväg + radnummer** och 1–2 rader
fixriktning — inga fulla patchar. Vid avtalsbrott: `contract #N`.

Avsluta med en rad **Sammanfattning**:

- "Inga blocker funna — OK att pusha." eller
- "N blocker / M high — bör fixas före push: <titlar>."

## Constraints

- **Read-only.** Inga edits, tester, builds, Railway-anrop eller push.
- **No fabrication.** Tom CRITICAL är ett giltigt resultat.
- **Cite line numbers.** Fynd utan citation räknas inte.
- **En rapport**, grupperad på allvar, inte per fil.
- **Betygsätt inte det du inte läste.** Säg det under OK.
- **Föreslå inte features.** Bara “den här koden är trasig / riskabel”.
- **Matcha stacken.** Next.js 15 App Router, React 19, Prisma 6,
  Auth.js v5, Railway. Inte Pages Router, inte Prisma 7, inte AWS.
- Svenska eller engelska — matcha diffen.

## Why this skill exists

Aqua Visibility har fyra ytor med olika sanningar (priser, ordrar,
fabrik, ekonomi). Syskonprojekten sköt regressioner som en read-only
diff på ~1 minut hade fångat. Skillen fångar dem; regeln
`.cursor/rules/prepush-bughunt.mdc` ser till att den körs varje gång.
