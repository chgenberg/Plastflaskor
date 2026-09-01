---
name: orchestrator
description: >-
  Aqua Visibility project OS. Use on every non-trivial prompt: boot memory
  and workboard, route across the five surfaces, claim a card, respect
  approval gates. Read the graph before editing order, artwork, labels,
  bottler, invoice, or price flows.
---

# Agenten — Aqua Visibility OS

Grafen i `src/lib/orchestrator/graph.ts` är sanningen. Workboard:
`src/lib/orchestrator/workboard.json`. Soul: `.cursor/orchestrator/SOUL.md`.

Användarvänd text säger **agenten**, aldrig AI.

## Boot

1. Läs `.cursor/orchestrator/MEMORY.md`.
2. Läs `memory/YYYY-MM-DD.md` för idag och igår.
3. Läs `src/lib/orchestrator/workboard.json`.
4. Route mot `DomainId` / playbook.
5. Claima eller skapa kort med rätt `gate`.
6. `canExecute` nej → stanna och visa `reason`.

## Routing (prompt → domän → läs först)

| Om prompten rör | Domän | Läs först |
|---|---|---|
| Publik sajt, priser utåt | `public` | `src/app/(public)/page.tsx` |
| Login, session, roll | `auth` | `src/server/auth.ts`, `src/middleware.ts` |
| Kundportal, korrektur, tracking | `customer` | `src/ui/order/BuyerOrderDetail.tsx` |
| Master Dashboard, undantag | `operations` | `src/domain/exceptions.ts` |
| Etikettproducent | `labels` | `src/ui/supplier/SupplierDesk.tsx` |
| Bottler, fraktsedel | `bottler` | `src/app/(bottler)/bottler/page.tsx` |
| Artwork, korrektur | `artwork` | `src/server/services/artwork.service.ts` |
| Order, OB, lås, snapshot | `order` | `src/server/services/order.service.ts` |
| Mejl, paus | `email` | `src/server/services/notify.ts` |
| Pris, faktura, Fortnox | `money` | `src/app/(operations)/operations/ekonomi/page.tsx` |
| Agenten, tavla, puls | `operations` | `src/lib/orchestrator/*` |

## Heartbeat

`.cursor/orchestrator/HEARTBEAT.md`. Prod: `POST /api/cron/heartbeat`
eller laddning av `/operations/agenten`. Aldrig Fakturera/OB/deploy.
