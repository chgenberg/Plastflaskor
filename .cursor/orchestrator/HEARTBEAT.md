# HEARTBEAT

Kör när någon skriver `/loop` mot den här filen, när Drift öppnar
`/operations/agenten`, eller när `POST /api/cron/heartbeat` tickar.

Svara `HEARTBEAT_OK` om inget kort behövs.

## Checklista

1. **Nya ordrar att granska** (`SUBMITTED` / `AQUA_REVIEW`) → `ex:review:<orderNo>`
   (domän `operations`, grind `none`). Ingen Hand som stänger kortet.
2. **Artwork hos Aqua** → `ex:artwork_aqua:<orderNo>` (`artwork`, `none`).
3. **Korrektur hos kund** → `ex:artwork_customer:<orderNo>` (`customer`, `none`).
4. **Etikett-deadline ej accepterad** → `ex:deadline_unaccepted:<orderNo>` (`labels`, `none`).
5. **Etiketter ej mottagna** → `ex:labels_not_received:<orderNo>` (`bottler`, `none`).
6. **Redo att fakturera** → `ex:invoice:<orderNo>` (`money`, `irreversible`). Ingen Hand.
7. **Repeat leads denna vecka** → `repeat-lead:<id>` (`order`, `none`).
8. **EMAIL_PAUSED** → `email-paused` (`email`). Ingen Hand. Lyft inte flaggan.

Villkor som är borta → kortet blir `done` (“Löst av heartbeat.”).

## Aldrig på ett tick

Deploy, Fakturera, markera betald, slutlig OB, lyfta mejlpaus, sätta pris, outreach.
