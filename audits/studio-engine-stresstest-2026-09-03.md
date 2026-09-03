# Designmotor — stresstest 2026-09-03

Persona: `kund@demo.aqua` på `/designa`, `/designa/vatten-fran-svensk-kalla-33cl` och `/designa/stenkulla-33`.
Agenter: LabelCanvas, Studio-skal, cupDocument/save, rena geometri-tester.

## Lagt

| Nivå | Fel | Fix |
|---|---|---|
| HIGH | Duk var `16/9`. Wrap är 220×90 (och syskon). Dieline och procent hamnade fel mot tryckytan. | `aspect-ratio: widthMm / heightMm` |
| HIGH | Y-clamp använde bleed från bredden. Lager kunde sitta i vertikal bleed. | `wrapInsets` per axel |
| HIGH | "Sparad" efter 700 ms utan `saveDesignAction`. | Debounce-utkast, grind bara på **Spara och beställ** |
| HIGH | Fortsätt utkast tappade `placed` och kunde krascha på saknad `scale`. | `cupDocumentJson` i draft-DTO + `normalizeLayers` |
| HIGH | HUD-position ignorerade zoom. Rad hamnade fel efter zoom. | `hudOffset(..., zoom)` |
| MEDIUM | Safe/trim var kvadratisk inset. | `inset: safeY% safeX%` |
| MEDIUM | Trackpad-scroll zoomade duken. | Zoom bara med ctrl/meta + nyp |
| MEDIUM | Peek/flatten ignorerade flipX, fit, align. | `flattenLabel` speglar 2D |
| MEDIUM | `qty` frös på första produktens MOQ. | `qty = product.moq` (visas inte) |

## Kvar (medvetet)

- Interaktiv 1440/390 i webbläsare kördes inte här. SSR + tester.
- Tom text har ingen träffyta förrän den har innehåll. Välj via Lager.
- PDF/AI på start låser dieline utan raster. Krav-panelen öppnas.
- Riktig LLM och ny canvas-SDK är utanför planen.

## Koll

- `npm test` efter lapparna.
- Inloggad kund-HTML: start, produkt, alias. Inga `kr` / `unitPriceExVat` / `minQty`.
