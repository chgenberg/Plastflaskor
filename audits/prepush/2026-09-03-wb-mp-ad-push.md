# Pre-push bug-hunt — Våg A–D (arbetsträd)

Datum: 2026-09-03  
Omjakt: HIGH-fix reject-artwork (samma dag).  
Scope: hela working tree mot `origin/main` (`HEAD` = `18473b6`). Kontraktsytor + reject-diffen.

---

## 1. CRITICAL (must fix before push)

Inga.

---

## 2. HIGH (should fix before push)

Inga. Tidigare HIGH är lagad:

- `rejectArtwork` anropar `sendArtworkRejected` (`artwork.service.ts:118`). Mock-titel **"Ny artwork behövs"**, inte korrektur (`mock/index.ts:203-220`).
- `needsNewArtworkAfterReject` + `customerActionFor` ber om ny fil (`orderBrief.ts:61-83`).
- `statusHint` visar "Ladda upp artwork" / "Kund ska ladda upp ny artwork" (`statusHint.ts:72-77`).
- `sendArtworkApproval` bara från `sendProof` (`artwork.service.ts:103`).
- Status orörd vid reject. Tester: 47/47.

---

## 3. MEDIUM (can fix in follow-up)

### Sticky-bar visar första variantens vatten

`src/ui/product/ProductCheckout.tsx:31,43`

### NeedsAttention på leverantör listar alla synliga jobb

`src/ui/supplier/SupplierDesk.tsx:68-79`

### AppShell Suspense-fallback antar `path="/"`

`src/ui/shell/AppShell.tsx:38-43,83`

### Etikett/bottler-listknapp är 32 px

`src/ui/shell/primitives.tsx:481` via `LabelJobsTable.tsx:132`. Jobbsida `lg` 48 px.

---

## 4. OK — verified correct

- Publik produkt: `publicProductDto` + `canSeePrices` + JSON-LD utan `offers`.
- Checkout: session + `assertCanSeePrices`; self-serve STANDARD; `acceptTerms` synlig.
- Snapshot låst vid OB. StatusEvent vid create. Session-RBAC. Prisma 6.
- Etikett/bottler utan `kr` / invoice / `unitPriceExVat`. `factoryOrder` select utan ekonomi.
- Dokument GET 404 via `getAuthorizedDocument`. POST Aqua-only.
- Inga mock-importer från `app`/`ui`. Live-adapters `notImplemented`.
- Hands rör inte irreversible/deploy.
- Safari-rad: relative på första `td`.

---

## Sammanfattning

Inga blocker funna — OK att pusha.
