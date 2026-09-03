# Pre-push hunt — Canva-etikettstudio

Scope: working tree mot `origin/main` (studio-skal, motor, cupDocument, /designa).

## CRITICAL (must fix before push)

Inga.

## HIGH (should fix before push)

Inga.

## MEDIUM (can fix in follow-up)

- `src/ui/studio/SelectionHud.tsx` 59–67 — justera-knapparna V/M/H saknar `aria-label`.
- `src/server/services/document.service.ts` 210–215 — Aqua-roll (`where: {}`) får senaste utkast i hela databasen.
- `src/ui/studio/Studio.tsx` 250–277 — två autosaves innan `designId` kommit tillbaka kan skapa två utkast.

## OK — verified correct

- `/designa` kräver session. Inga `kr` / `unitPriceExVat` / `minQty` i UI.
- Default är 2D-etikett. Flaska är tittruta.
- `printGate` + `assertRequiredPrintPlaced` på Spara och beställ. Autosave kräver inte grinden.
- `saveDesignAction` tar roll från session. Klienten skickar inte pris.
- Dukens `aspect-ratio` följer wrap mm. Bleed/safe per axel.
- Inga mock-adapters i `src/ui` / `src/app`.
- `await params` på `/designa/[product]`.

Sammanfattning: Inga blocker funna — OK att pusha.
