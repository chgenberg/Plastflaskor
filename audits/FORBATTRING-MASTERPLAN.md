# Aqua Visibility OS — förbättringsmasterplan

Utgångsläge 2026-09-03: ny kund kan inte beställa själv. `/kassa` var en redirect.
Serverpris, snapshot vid OB och rollgränser är intakta. Det får inte förstöras.

Live: `plastflaskor-production.up.railway.app`. Deploy bara på explicit ja efter
`av-bug-hunter-prepush`.

## Det som redan är starkt (rör inte utan anledning)

- `createBuyerOrder` räknar pris via `resolvePrice` — klienten skickar aldrig belopp
- `sendOrderConfirmation` låser `priceSnapshotJson` + `lockedAt`
- `customerApproveProof` går inte till CONFIRMED
- `canSeePrices` / `publicProductDto` / `requireSupplier`
- Etikett/bottler-PDF utan kr
- `EMAIL_PAUSED`

## Våg A — Köpflöde och kontrakt (klart lokalt, push väntar)

Registrering i kassan, STANDARD, pris efter konto, ≤4 skärmar. Se
`docs/masterplan/00-INDEX.md`.

Efter A: `scripts/qa/no-kr-public.ts` + walkthrough + bug-hunt. Deploy bara på uppmaning.

## Våg B–E

Se `docs/masterplan/10-vagor-och-sekvens.md`.
