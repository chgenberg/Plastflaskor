# 03 — Registrering i kassan

Filen äger kassa-modalens UX, fält, validering, org.nr-slagning,
sessionshantering och adopt av anonym designdraft. Server actions och routing
ägs av fil 01. Produktsidan och konfiguratorn ägs av fil 02.

> **Bindande beslut efter samgranskning (se `00-INDEX.md` §3).** Där texten nedan
> säger `registerAndOrderAction({ step: "account" | "order" })` gäller i stället två
> actions från 01: `registerCheckoutAction` (steg A) och `placeCheckoutOrderAction`
> (steg B). Zod-unionen nedan delas därför i `checkoutRegisterSchema` och
> `checkoutOrderSchema` i `src/domain/schemas/checkout.ts` — fälten är exakt de som
> listas här (03 äger fältlistan, 01 äger actions). Steg "done" i modalen stryks:
> `placeCheckoutOrderAction` gör `redirect("/kassa/bekraftelse?order=")` direkt, så
> bekräftelsen är skärm 4. `Order.clientToken String? @unique` läggs i schemat av 01.

## Mål

- Besökare på en profilvatten-produktsida skapar konto och lägger order
  i samma dialog, utan att lämna sidan.
- Inga `kr` innan kontot finns. Priset kommer från servern i steg B.
- Inloggad kund hoppar direkt till steg B och ser "Inloggad som …".
- Klicket på "Godkänn villkoren & beställ" är villkorsaccepten.
- Dubbelklick, retry eller omladdning ger aldrig två konton eller ordrar.

## Vad BBB gör

`Billboardbee-2.0/src/components/agent/booking-modal.tsx`:

- Portal till `document.body` (rad 294). `role="dialog"`,
  `aria-modal="true"` (rad 297–299). Esc stänger om inte `busy`
  (rad 129–135). Backdrop-klick stänger (rad 300–302).
- Session via `/api/auth/me` (rad 75–106). `needsAccount` rad 169.
- Anonym: e-post, telefon, lösenord ≥ 8, org.nr, valfri fakturaadress
  (rad 332–443). Inloggad: "Inloggad som {email}" (rad 444–450). Alltid:
  kampanjnamn (rad 478–491) och fakturamärkning (rad 493–505).
- Org.nr-slagning vid 10 siffror mot `/api/orgnr` (rad 137–167). Lägen
  `loading` / `found` / `miss`.
- `ready`-gate (rad 177–183). Knappen bär accepten (rad 173–176).
- `authenticate()` (rad 185–263): POST `/api/auth/signup` (rad 203–219).
  409 → prova login med samma lösenord (rad 221–232), annars "E-post-
  adressen har redan ett konto, men lösenordet stämmer inte." Felkoder →
  svensk text (rad 234–248). Villkor som lista (rad 13–19, 508–535).

`src/app/api/auth/signup/route.ts`: rate limit 5/IP (rad 15–17),
validering (rad 21–53), org-lookup (rad 54) via
`src/lib/orgnr-lookup.ts` (`KNOWN` rad 21–34, allabolag rad 44–106,
aldrig påhittat bolag). E-post finns → 409 (rad 56–58). User +
Organization + Membership i ett `create` (rad 63–93). `P2002` → 409
(rad 94–104). `adoptAnonymousData` (rad 106–109) flyttar data från cookie
`bb_uk` (`src/lib/user-key.ts` rad 4) till `u:<userId>`;
`src/lib/auth/adopt.ts` rad 11–50 kastar aldrig. `createSession` rad 121.

Idempotens: `findRecentDuplicateBooking` i `src/lib/bookings.ts`
rad 78–105 — samma ägare, fönster, skyltset, totalpris inom 10 min.

Bekräftelse: `src/components/agent/steps/final-step.tsx` rad 41–59.
Redirect till `/dashboard` efter 8 s (rad 11, 19–28). Nedräkning i
`aria-live="polite"` (rad 65).

## Vad Aqua har idag

- Ingen signup. `src/app/(public)/login/page.tsx`: bara login (rad 27–39)
  och demokonton (rad 41–49). `loginAction` i `src/actions/index.ts`
  rad 34–51 kör `signIn("credentials", { redirect: false })` (rad 39).
- Auth.js v5 credentials i `src/server/auth.ts`, `bcrypt.compare` rad 23.
  Hash-kostnad 10 i `prisma/seed.ts` rad 534 (`bcryptjs` ^3.0.3).
  JWT-callback hydrerar från DB (rad 38–53). `getSessionUser` i
  `src/server/rbac.ts` rad 6–35 nekar inaktiva.
- `placeBuyerOrderAction` rad 83–130 kräver session (rad 84–85) och
  `customerId` (rad 109). `createDirectCustomer` i
  `src/server/services/customer.service.ts` rad 29–65 skapar `Customer`
  + `Address(SHIPPING)`, inte `Company` eller `User`.
- `prisma/schema.prisma`: `User` rad 121–138. `Company` rad 140–152 med
  `orgNr @unique` (rad 142). `Customer` rad 168–185, `priceListId?`.
  `Address` rad 187–200. `PriceListCode` rad 61–66. `Design` rad 354–372,
  `userId String?` rad 357.
- Pris: `getPriceListForBuyer` i `catalog.service.ts` rad 50–75, fallback
  STANDARD rad 66–68. `resolvePrice` i `order.service.ts` rad 157–162,
  anropas i `createBuyerOrder` rad 224. `canSeePrices` i
  `src/domain/policies/priceVisibility.ts` rad 4–6.
- Dialog: `src/ui/order/OrderPeek.tsx` — nativ `<dialog>` + `showModal()`
  (rad 21), `aria-labelledby` (rad 34), backdrop stänger (rad 35–37).
  CSS `.av-peek` i `src/app/styles/tokens.css` rad 739–804. `Button`
  (rad 410–422) och `controlClass` (rad 343–344) i
  `src/ui/shell/primitives.tsx`.
- `/kassa` och `/kassa/bekraftelse` är 7-raders redirect-stubbar.
- `/designa` gated i `src/middleware.ts` rad 50. `saveDesignAction`
  sätter `userId: user?.id` (rad 502) och tål `null`.
- Zod ^4.4.3 i `src/domain/schemas.ts`. Katalogen `src/domain/schemas/`
  är tom. `IntegrationRegistry` i `src/server/integrations/types.ts`
  rad 48–55, `INTEGRATION_MODE` i `composition.ts` rad 9–10. Ingen
  bolagsslagning finns.

## Ändringar

### Beslut: två steg i en dialog

"Inga kr före registrering" kräver en server-rundtur mellan kontoskapande
och prisvisning, så ett äkta ett-stegsflöde är omöjligt. Därför två steg i
samma `<dialog>`: **A Konto** → **B Pris + leverans + referens → Beställ**.
Ingen extra skärm. Inloggad börjar i B. En server action med två faser.

### `src/ui/checkout/OrderModal.tsx` (ny, `"use client"`)

Props: `{ productId, variantId, qty, options, designId?, me: { email,
customerId } | null, onClose }`. `me` kommer från produktsidans server
component (fil 02). Ingen klientfetch av session.

- Nativ `<dialog ref>` som `OrderPeek`. `showModal()` i `useEffect`.
  Klass `av-peek av-peek--checkout`. `aria-labelledby="av-checkout-title"`.
  `onCancel` (Esc) → `preventDefault()` om `busy`. Backdrop stänger bara
  när `!busy`. Fokus på första fältet per steg.
- State: `step: "account" | "order" | "done"`, `mode: "signup" | "login"`,
  `busy`, `error`, `quote`, `clientToken = useRef(crypto.randomUUID())`.
- Steg A: org.nr, företagsnamn (från slagning, redigerbart), e-post,
  lösenord (`new-password`), telefon. Knapp "Skapa konto och visa pris".
  Hjälptext: "Priset visas i nästa steg. Prislista Standard." Ingen `kr`.
- Steg B: prisrad från `quote` ("exkl. moms"), leveransadress (gata,
  postnr, ort), fakturareferens (obligatorisk, max 60), villkorslista,
  knapp "Godkänn villkoren & beställ". Inloggad ser "Inloggad som {email}
  — ordern kopplas till ditt konto."
- Steg done: orderNo, produkt, antal, totalt, "Orderbekräftelse kommer
  från agenten inom 24 timmar." Länk till kundportalen. Efter 8 s
  `router.push("/kassa/bekraftelse?order=" + orderNo)`. Nedräkning i
  `aria-live="polite"`. Fel i `<p role="alert">`.

```tsx
async function submitAccount(form: AccountFields) {
  setBusy(true); setError(null);
  const res = await registerAndOrderAction({ step: "account", clientToken, ...form });
  setBusy(false);
  if (res.ok) { setQuote(res.quote); setStep("order"); return; }
  if (res.code === "EMAIL_TAKEN") setMode("login");
  setError(res.message);
}
```

### `src/domain/schemas/checkout.ts` + `src/domain/orgNr.ts` (nya)

`orgNr.ts`: `normalizeOrgNr`, `formatOrgNr` (`XXXXXX-XXXX`, som seed
rad 750), `isValidOrgNr` med Luhn mod 10. Test i `orgNr.test.ts`.

```ts
export const orgNrSchema = z.string().transform(normalizeOrgNr)
  .refine((d) => d.length === 10 && isValidOrgNr(d), "Ogiltigt organisationsnummer");

const accountStep = z.object({
  step: z.literal("account"), clientToken: z.string().uuid(), login: z.boolean().default(false),
  companyName: z.string().trim().min(2).max(120), orgNr: orgNrSchema,
  email: z.string().trim().toLowerCase().email(), password: z.string().min(8).max(200),
  phone: z.string().trim().regex(/^\+?[\d\s()./-]{7,20}$/), designId: z.string().uuid().optional(),
});
const orderStep = z.object({
  step: z.literal("order"), clientToken: z.string().uuid(),
  variantId: z.string().min(1), qty: z.number().int().min(1),
  line1: z.string().trim().min(2), postalCode: z.string().trim().min(5), city: z.string().trim().min(2),
  invoiceRef: z.string().trim().min(1).max(60), acceptedTermsAt: z.string().datetime(),
  waterType: buyerOrderSchema.shape.waterType, cap: buyerOrderSchema.shape.cap,
  color: buyerOrderSchema.shape.color, designId: z.string().uuid().optional(),
});
export const registerAndOrderSchema = z.discriminatedUnion("step", [accountStep, orderStep]);
```

Vid `login: true` krävs bara `email` + `password`. Prislista är inte ett
fält — servern sätter STANDARD. `acceptedTermsAt` loggas i `StatusEvent.payload`.

### Serverkontrakt mot fil 01

Steg `account`, signup:

1. `user.findUnique({ email })` finns → `{ ok:false, code:"EMAIL_TAKEN" }`.
2. `company.findUnique({ orgNr: formatOrgNr(d) })` finns med användare →
   `code:"ORG_TAKEN"`, "Företaget har redan ett konto. Logga in eller be
   en kollega bjuda in dig." Skyddar mot kapning via org.nr.
3. Slå upp bolag via porten. Registrets namn vinner. Adress föreslås i B.
4. `bcrypt.hash(password, 10)` som seed rad 534.
5. Ett `$transaction`: `Company` → `Customer { priceListId: STANDARD.id }`
   → `User { role:"CUSTOMER", companyId, customerId }`. `P2002` → 1–2.
6. Adopt av `designId` (nedan).
7. `signIn("credentials", { email, password, redirect:false })` som
   `loginAction` rad 39. Cookie sätts i action-svaret.
8. `getPriceListForBuyer({ customerId, variantId })` + `resolveUnitPrice`
   → `{ ok:true, quote:{ unitPriceExVat, totalExVat, currency } }`.
   Saknas pris → `code:"NO_PRICE"`, modalen länkar till `/offert`.

`login: true`: `signIn` med `redirect:false`, sedan `getSessionUser()`.
Rollen måste vara `CUSTOMER` med `customerId`, annars `signOut` +
`code:"NOT_A_CUSTOMER"`, "Det här kontot kan inte beställa." Så ser
LABEL/BOTTLER/staff/RESELLER aldrig kr i kassan.

Steg `order`: kräver session med `customerId`. Reprisera via
`createBuyerOrder` (rad 195). Klientpris ignoreras. Svar `{ ok:true, orderNo }`.

### `src/server/integrations/ports/companyLookup.ts` + adapters

```ts
export type CompanyHit = { name: string; line1: string; postalCode: string; city: string };
export interface CompanyLookupService {
  lookup(orgNrDigits: string): Promise<CompanyHit | null>; // null = miss, hittar aldrig på
}
```

- `companyLookup` läggs i `IntegrationRegistry` (`types.ts` rad 48–55).
- `adapters/mock/companyLookup.ts`: 3–4 kända org.nr (jfr BBB `KNOWN`
  rad 21–34), inkl. seedens `5598880101` → "Fikastunden Direkt AB".
  250 ms delay. Övriga → `null`. `adapters/live/companyLookup.ts`: stub
  som kastar "Bolagsslagning ej konfigurerad".
- Ny server action `lookupCompanyAction(orgNr)` i `src/actions/index.ts`:
  `orgNrSchema` → `getIntegrations().companyLookup.lookup`. Frontend
  importerar aldrig adaptern. Modalen anropar vid 10 giltiga siffror,
  debounce 300 ms, `cancelled`-flagga som BBB rad 144–166. Lägen: "Hämtar
  företag…", namn + adress, "Hittade inget bolag. Fyll i namnet själv."

### Dubblettskydd

- `clientToken` skapas per öppnad modal och skickas i båda stegen.
- Steg `account`: unikhet på `User.email` och `Company.orgNr` räcker.
  Retry efter lyckat skapande ger `EMAIL_TAKEN` → inline-login.
- Steg `order`: före `createBuyerOrder` kör servern
  `findRecentDuplicateOrder`: 10 min, `SUBMITTED`, samma `customerId`,
  variant, qty, `clientToken` → befintligt `orderNo`. Förslag till fil 01:
  `Order.clientToken String? @unique`. Fallback utan schemaändring:
  BBB-logiken rad 78–105 (variant + qty + adress + 10 min).
- Knappen disabled medan `busy`. `busyRef` blockerar Esc.

### Adopt av anonym `Design` — framtida

Omöjligt i dag: `/designa` kräver CUSTOMER (middleware rad 50). När
studion öppnas publikt: `saveDesignAction` skapar redan `Design` med
`userId: null` (rad 502). Studion skickar `?design=<id>` → `designId` i
modalen. I steg `account`, efter `User`: `design.updateMany({ where: { id,
userId: null, createdAt: { gte: -24h } }, data: { userId } })`. Guarden
`userId: null` hindrar adopt av annans design. Komplement som BBB `bb_uk`:
httpOnly-cookie `av_draft` med draft-id:n.

### `src/app/styles/tokens.css`

Modifier `.av-peek--checkout`. Under 640 px: `width:100vw; height:100dvh;
max-height:100dvh; margin:0; border-radius:0; border:0`. Primärknappen
`position: sticky; bottom: 0; padding-bottom: env(safe-area-inset-bottom)`.

## Kontraktskontroll

| Kontrakt | Hur filen håller det |
| --- | --- |
| Pris räknas på servern | `quote` kommer från steg A. Steg B skickar inget pris. |
| Checkout repriserar | Steg `order` → `createBuyerOrder` → `resolvePrice` (rad 224). |
| Snapshot låses vid OB | Orörd. Modalen skriver ingen snapshot. |
| Inga publika kr | Steg A renderar ingen `kr`. `quote` finns först efter lyckad `signIn`. |
| STANDARD automatiskt | Servern sätter `priceListId`. Schemat har inget prislistefält. |
| Prislistor blandas inte | Befintlig kund reprisas på egen lista via `getPriceListForBuyer`. |
| Ingen ÅF-portal | `RESELLER` nekas i inline-login. |
| Etikett/bottler ser inte kr | Samma spärr, `signOut` vid fel roll. |
| Inga mock-imports i frontend | Slagning via `lookupCompanyAction`. |
| "agenten", aldrig AI | Bekräftelse och villkor granskas. |
| Hash som i dag | `bcrypt.hash(pw, 10)` som seed rad 534. |

## Acceptanskriterier

Funktion

- [ ] Anonym → "Beställ" → steg A. `document.body.innerText` matchar inte
      `/\d\s?kr/`.
- [ ] Giltigt org.nr fyller företagsnamn inom 1 s i mock. Fel
      kontrollsiffra → fel före submit. Lösenord 7 tecken → fel, 8 → OK.
- [ ] Efter steg A finns `User(CUSTOMER)`, `Customer(STANDARD)`,
      `Company(orgNr)` och session-cookie. Steg B visar pris.
- [ ] Befintlig e-post → "E-posten har redan ett konto", fältet byter till
      `current-password`. Rätt lösenord → steg B utan nytt konto.
- [ ] `labels@demo.aqua` i modalen → "Det här kontot kan inte beställa."
      Ingen `kr`. Inloggad `kund@demo.aqua` → direkt steg B.
- [ ] Steg B utan fakturareferens → knappen disabled.
- [ ] Dubbelklick på "Godkänn villkoren & beställ" → exakt en order med
      rätt `customerId`, `unitPriceExVat` från STANDARD, `invoiceRef`.
- [ ] Bekräftelsevy visar `orderNo`. Efter 8 s:
      `/kassa/bekraftelse?order=AV-…`.
- [ ] `isValidOrgNr`: 20 giltiga + 20 ogiltiga, inkl. `5598880101`.

Tillgänglighet

- [ ] Fokus i dialogen vid öppning. Tab cyklar inte ut (`showModal()`).
- [ ] Esc stänger när inte `busy`. Esc under `busy` gör inget.
- [ ] `aria-labelledby` pekar på rubriken, som byter per steg.
- [ ] Fel via `role="alert"`. Pris och nedräkning via `aria-live="polite"`.
- [ ] Alla fält har `<label>`. Bara `--av-*`-tokens. Ingen orange.

Mobil

- [ ] Under 640 px fullskärm utan rundade hörn. Primärknappen synlig utan
      scroll och respekterar `safe-area-inset-bottom`.
- [ ] `inputMode="numeric"` för org.nr/postnr, `type="tel"`, `type="email"`.

## Beroenden

- **01**: `registerAndOrderAction` med två faser, `findRecentDuplicateOrder`,
  ev. `Order.clientToken`, samt att `/kassa/bekraftelse` visar ordern i
  stället för redirect. Denna fil levererar schema och svarskontrakt.
- **02**: knappen som öppnar `OrderModal` med `variantId/qty/options/
  designId/me`. Ersätter "Logga in och beställ" (produktsidan rad 63–66).
- **05**: `/konto/ordrar/{orderNo}` efter registrering och e-post via
  `getIntegrations().email.sendOrderConfirmation`.

## Uppskattad storlek

- `OrderModal.tsx` ~320 rader. Schema + `orgNr.ts` + test ~120.
  Port + mock + live-stub + `lookupCompanyAction` ~90. CSS ~25.
- Totalt ~550 rader ny kod. 5 nya filer, 3 ändrade (`types.ts`,
  `actions/index.ts`, `tokens.css`). 1,5–2 dagar inkl. test av
  inline-login och dubblettskydd.
