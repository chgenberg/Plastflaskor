---
name: av-prod-walkthrough
description: >-
  Aqua Visibility OS produktionsvandring. Körs mot Railway eller localhost
  för att bevisa att ny kund når order på 4 skärmar, att anonym inte ser kr,
  och att labels/bottler aldrig ser kr. Trigger: "kör produktionsvandringen",
  "vandra prod", "testa hela kedjan".
---

# Aqua Visibility OS — produktionsvandring

Read-only mot produktion utom throwaway-personas `@aqua-qa.example.com`.

## Kör

1. `QA_BASE` = live eller `http://localhost:3000`. Skriv inte ut `DATABASE_URL`.
2. `npx tsx scripts/qa/no-kr-public.ts` — måste vara 0 CRITICAL.
3. När `persona-walkthrough.mjs` finns: `QA_BASE=… node scripts/qa/persona-walkthrough.mjs`.
   Playwright-core är **inte** tillagt ännu (beslut Våg E: först fetch-smoke, sedan
   playwright när walkthrough-skriptet skrivs).
4. Läs `audits/walkthrough/` eller `audits/prod-walkthrough/<stamp>/REPORT.md`.

## Vad som måste faila

- Anonym ser `kr` / `unitPriceExVat`
- Ny kund får annan lista än STANDARD
- Bekräftelse efter fler än 4 skärmar
- labels@ / bottler@ ser `kr` eller faktura
- `undefined` / `NaN` i synlig text
- "AI" i användartext

## NEVER_CLICK

Fakturera, Markera betald, Skicka orderbekräftelse (slutlig OB). Default: stanna
före OB. `WALK_OB=1` är enda vägen förbi, och bara när användaren sätter den.

## Svar

`Vandring klar — N CRITICAL, N HIGH, N MEDIUM.` plus 3–8 rader med sökväg.
