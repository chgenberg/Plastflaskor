# MEMORY

Aqua Visibility OS. Agenten är en kollega, inte en chatt.

- V1 orderbart = profilvatten. Fem ytor: sajt, Master Dashboard, kundportal, /labels, /bottler.
- Huset: Order → Etiketter (ETD/POD) / Bottler (accept/POD/FRAKT) / Kund (Korr/POA/OB) → Frakt/POD → Faktura (Fortnox-mock).
- En order, en databas. Kvitto är inte slutlig OB.
- irreversible: Fakturera, markera betald, skicka slutlig OB.
- Mejlpaus: EMAIL_PAUSED=1. Lyfts inte av en Hand.
- Deploy: av-bug-hunter-prepush utan CRITICAL/HIGH + explicit ja.
- Etikett och bottler ser aldrig kr eller faktura.
- Publik katalog har inga kundpriser.
