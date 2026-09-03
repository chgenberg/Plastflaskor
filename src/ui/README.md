# `src/ui/` — React

Ytor, inte en komponenthög. Ny fil i ytan den tillhör.

| Mapp | Yta |
|---|---|
| `public/` | Publik sajt |
| `home/` | Startsida, tre akter |
| `product/` | Produktsida, konfigurator |
| `checkout/` | Kassa-modal |
| `order/` | Orderkort, peek, formulär |
| `ops/` | Master Dashboard |
| `supplier/` | `/labels` och `/bottler` |
| `shell/` | AppShell, primitives, tokens-nära UI |
| `studio/` | Designer |
| `motion/` | Reveal, Parallax |

`"use client"`-filer får bara `import type` från `@/server`.
Mutationer går via `src/actions/`. Ingen Prisma.
