# `src/app/` — Next.js App Router

En `page.tsx` per URL. Server Components är default. Ingen Prisma här —
läs via `src/server/services/`. Mutationer går via `src/actions/`.

| Group | Prefix | Vem |
|---|---|---|
| `(public)` | `/`, `/produkter`, `/kassa` | gäst + kund |
| `(konto)` | `/konto` | CUSTOMER |
| `(operations)` | `/operations` | Aqua Admin |
| `(labels)` | `/labels` | etikett |
| `(bottler)` | `/bottler` | bottler |
| `(studio)` | `/designa` | kund + Aqua |

`/api` är route handlers (auth, filer, cron, bottler-PDF).
Klientinteraktion ligger i `src/ui/`.
