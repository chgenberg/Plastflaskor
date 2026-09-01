# Aqua Visibility — Agent-OS

Projekt: Aqua Visibility OS
Datum: 2026-09-01

## 1. Röst

- [x] agenten
Ord som aldrig får synas utåt: AI, assistenten, chatbot

## 2. Domäner

public, auth, customer, operations, labels, bottler, artwork, order, email, money

Kanter: login → yta → order → artwork → etikett → bottler → faktura.

Never-knapp: Fakturera / markera betald / slutlig OB → `irreversible`.

Mejl: `EMAIL_PAUSED`. Aqua Admin får lyfta.

Deploy: `av-bug-hunter-prepush`, CRITICAL/HIGH = stopp.

## 3. Fas

- [x] Fas 1: Cursor + JSON-tavla
- [x] Fas 2: Prisma + puls + Drift-yta (laddning av /operations/agenten)
Cron-secret: `CRON_SECRET`
Schema: 15–30 min när cron finns; tills dess tick vid Agenten-sidan.
