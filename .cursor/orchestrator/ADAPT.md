# Aqua Visibility — Agent-OS

Projekt: Aqua Visibility OS
Datum: 2026-09-01

## 1. Röst

- [x] agenten
Ord som aldrig får synas utåt: AI, assistenten, chatbot

## 2. Domäner

public, auth, order, operations, labels, bottler, customer, artwork, freight, money, email

Kanter: Order → Etiketter (accept ETD → POD) / Bottler (accept → POD → FRAKT) / Kund (Korr → POA → OB) → Frakt → POD → Faktura → Fortnox-mock.

Never-knapp: Fakturera / markera betald / slutlig OB → `irreversible`.

Mejl: `EMAIL_PAUSED`. Aqua Admin får lyfta.

Deploy: `av-bug-hunter-prepush`, CRITICAL/HIGH = stopp.

## 3. Fas

- [x] Fas 1: Cursor + JSON-tavla
- [x] Fas 2: Prisma + puls + Drift-yta (laddning av /operations/agenten)
Cron-secret: `CRON_SECRET`
Schema: 15–30 min när cron finns; tills dess tick vid Agenten-sidan.
