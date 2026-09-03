# `src/actions/` — tunna mutationer

`"use server"`. Validera input, anropa `src/server/services/`, redirecta.
Ingen Prisma-loop här. Ingen UI.

| Fil | Vad |
|---|---|
| `checkout.ts` | Registrering, prispreview, lägg order |
| `index.ts` | Befintliga order-/konto-actions |
| `opsMasters.ts` | Kund och katalog i operations |
| `catalogMasters.ts` | Produktmaster |

Ny mutation: ny fil eller rätt befintlig, inte i `page.tsx`.
