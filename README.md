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
| kund@demo.aqua | /konto (slutkund) |
| staff@demo.aqua | /operations (Admin) |
| admin@demo.aqua | /operations (Admin) |
| factory@demo.aqua | /factory |

## Demo-vandring (QA)

1. Logga in som `kund@demo.aqua` → `/konto` → Ny order (pappersmugg, MOQ, leveranskrav).
2. Staff: `/operations` → New Orders → granska, extras, skicka till korrektur.
3. Skapa korrektur (PROOF) → kund godkänner på `/konto`.
4. Staff skickar OB med repeat-horisont → ordern låses.
5. Factory: Accept deadline → Startad → Klar.
6. Staff skapar fraktsedel → factory Mark as Shipped → Delivered.
7. Invoice (mock Fortnox) syns på `/konto/fakturor` och `/partner/fakturor` — inte på `/factory`.
8. Lead skapas en månad före horisont; `/operations/leads` kan öppna/repeat/snooza.
9. Publik `/produkter` och `/kassa` visar inga `kr` för gäst.

## Integrationer

`INTEGRATION_MODE=mock` (default). Byt till `live` när Fortnox/frakt är klara — UI ändras inte.
