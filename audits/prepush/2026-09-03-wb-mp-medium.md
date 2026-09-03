# Pre-push bug-hunt — MEDIUM-fix A–D

Datum: 2026-09-03  
Scope: sticky-bar, SupplierDesk, AppShell, etikett/bottler-listknappar.

## 1. CRITICAL

Inga.

## 2. HIGH

Inga.

## 3. MEDIUM

Inga kvar från förra rapporten.

- Sticky följer valt vatten via `onPreview` (`ProductCheckout.tsx`, `ProductConfigurator.tsx:80-85`).
- `supplierNeedsAttention` hoppar över "Öppna jobb" (`supplierDesk.ts`, `SupplierDesk.tsx`).
- AppShell läser `usePathname` utanför Suspense (`AppShell.tsx:37-49`). Fallback har rätt path.
- Liståtgärd + Print all är `size="lg"` (`min-h-12` = 48 px).

## 4. OK

- `qa:no-kr` 12 sidor. Tester 48/48.
- Inga `kr` tillagda på etikett/bottler.
- Inte klickat lime i webbläsare (inga browser-verktyg). Logik täcks av `waterKindLabel` + preview-callback.

## Sammanfattning

Inga blocker funna — OK att pusha.
