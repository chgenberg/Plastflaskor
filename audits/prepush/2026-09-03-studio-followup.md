# Pre-push hunt — studio follow-up

Scope: 11 filer mot `origin/main` (HUD, draft-scope, Stenkulla-alias, water/SKU).

## CRITICAL (must fix before push)

Inga.

## HIGH (should fix before push)

Inga.

## MEDIUM (can fix in follow-up)

- `src/ui/studio/Studio.tsx` mount-effect: produktslug med matchande utkast kör `applyDraft` alltid. Tom start på samma SKU går inte utan att rensa.

## OK — verified correct

- HUD `stopPropagation` så Spegla/Ta bort inte byter till artwork.
- `getLatestStudioDraft` är egna `DRAFT` utan `orderId`. Aqua ser inte kundens senaste.
- `/designa/stenkulla-33` mappar till Stenkulla.
- `variantSku` följer stilla/kolsyrat. Peek får `water`.
- Inspektör fångar upload-mål vid val. Inga `kr` / `minQty`. Inga mock-imports.

Sammanfattning: Inga blocker funna — OK att pusha.
