# `src/server/` — server-only

Prisma, session, services, integrationer, PDF och lokal storage.
Nytt i det här lagret får `import "server-only"` överst.

Klienten (`"use client"`) får bara `import type`. Anropa funktioner härifrån
via `src/actions/` eller en Server Component i `src/app/`.

| Mapp | Vad |
|---|---|
| `services/` | Order, katalog, kund, artwork, produktion |
| `integrations/` | Port + mock/live. Frontend importerar aldrig mock. |
| `pdf/` | LR/BF och liknande. Inga belopp på fabrikens PDF. |
| `storage/` | Uppladdade filer |

`rbac.ts` och `supplierAccess.ts` är grindarna. Pris räknas här, aldrig i UI.
