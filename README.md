# AquaVisibility OS

B2B-plattform för Aqua Visibility: publik sajt, ÅF-portal, operations och fabrik. Copy från [aquavisibility.se](https://aquavisibility.se). Inga publika priser.

## Starta

```bash
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Öppna http://localhost:3000

## Demo-konton

Lösenord: `AquaDemo26!`

| E-post | Yta |
|---|---|
| reseller.standard@demo.aqua | /partner (Standard) |
| reseller.gold@demo.aqua | /partner (Gold) |
| staff@demo.aqua | /operations |
| admin@demo.aqua | /operations |
| factory@demo.aqua | /factory |

## Integrationer

`INTEGRATION_MODE=mock` (default). Byt till `live` när Fortnox/frakt är klara — UI ändras inte.
