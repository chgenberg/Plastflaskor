# MEMORY

- Aqua V1 = profilvatten. Fem ytor: sajt, Master Dashboard, kundportal, /labels, /bottler.
- Huset (pappersskiss): Order → Etiketter (accept ETD → POD) / Bottler (accept → POD → FRAKT) / Kund (Korr → POA → OB) → Frakt → POD → Faktura → Fortnox-mock.
- Word: Korr/POA före låst OB. customerApproveProof går inte till CONFIRMED.
- sendOrderConfirmation låser snapshot och släpper till etiketter.
- irreversible = Fakturera / markera betald / slutlig OB.
- Fortnox är mock tills live.
- Indata: Josefine / Indatahuset (skiss). Ingen egen yta ännu.
- Mejlpaus-env: EMAIL_PAUSED.
- Demo: kund@ / staff@ / admin@ / labels@ / bottler@demo.aqua · AquaDemo26!
- Aqua intern roll är Admin. AQUA_STAFF är alias med samma befogenheter.
