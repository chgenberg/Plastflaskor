# 06 — Dashboard-shell och generiskt kit

Förebild: Billboardbee 2.0 (`/Users/christophergenberg/Desktop/Billboardbee-2.0`, nedan **BBB**).
Mål: Aqua Visibility OS (`/Users/christophergenberg/Desktop/Par_tryckeri`, nedan **Aqua**).
Alla sökvägar och radnummer nedan är verifierade mot koden 2026-09-03.

## Mål

- **En shell** som alla fyra dashboards delar — kundportal (`/konto`), Master Dashboard (`/operations`), etikett (`/labels`) och bottler (`/bottler`) — med samma mått, samma nav-mekanik och samma fot (användare, Inställningar där det finns, Logga ut).
- **Ett generiskt kit** i `src/ui/shell/primitives.tsx` som 07 (kundportalens hem/orderhub) och 08 (operations/labels/bottler-hemmen) bygger på utan att uppfinna egna kort, listor eller status-chips.
- **Mobil som fungerar**: fixerad topbar med aktiv sektionsrubrik, tabbar i botten med de fyra viktigaste ingångarna + "Mer", och en drawer som stängs med Esc, klick på overlay och vid navigering. Dagens Aqua-mobil (`av-shell-mobile`, sticky header med hela navet utfällt) ersätts.
- **Åtgärdsdriven hemsida per roll**: hemmet börjar med det som kräver handling (`NeedsAttention`), sedan lugn status (`StatusInfo`), sedan KPI/lista, sist snabblänkar (`QuickLinks`). Status-chips visar **nästa steg** ("Godkänn korrektur", "Saknar artwork") före rå DB-status.
- Aquas färger och tokens behålls (`--av-accent #005caf`, `src/app/styles/tokens.css` rad 30–50). Inga nya paket, ingen lucide — ikoner löses med text/`aria-label` eller inline-SVG i kitet.

## Vad BBB gör

**Shell** — `src/components/dashboard/dashboard-shell.tsx`
- `NAV_BY_ROLE: Record<string, NavItem[]>` rad 37–82; `NavItem = { href, label, icon, exact? }` rad 35. En platt lista per roll, ingen gruppering. `SETTINGS_ONLY_NAV` rad 135–137 används när `lockToSettings` är satt (rad 166–175 tvingar `router.replace("/dashboard/installningar")`, med undantag för bokningsflödet rad 139–145).
- `ROUTE_TITLES` + `titleForPath()` rad 87–126 ger topbar-rubrik för undersidor som inte är nav-poster (matchar längsta prefix).
- Desktop: `<aside class="fixed inset-y-0 left-0 z-40 hidden w-64 … lg:flex">` rad 208; main-wrapper `lg:pl-64 lg:pt-0` rad 298. Aktiv länk `bg-black text-white`, inaktiv `text-muted hover:bg-faint` rad 355–359. Länkhöjd `px-3 py-2.5 text-sm rounded-xl`.
- Mobil topbar rad 213–230: `fixed inset-x-0 top-0 z-50 … lg:hidden`, `h-14`, visar `pageTitle` (aktiv nav-label eller `titleForPath`) och en avatar-knapp med initialer som öppnar drawern (`aria-expanded`, `aria-controls="dashboard-mobile-drawer"`).
- Mobil tabbar rad 233–267: `fixed inset-x-0 bottom-0 z-50`, `h-16`, `tabs = nav.slice(0, 4)` rad 203 + en "Mer"-knapp; aktiv flik `aria-current="page"`, `text-[10px]`.
- Drawer rad 270–295: overlay `bg-black/40 backdrop-blur-sm` som stänger på klick, panel `w-72` med `translate-x` transition, `inert={!open}`, stängknapp; Esc-lyssnare rad 177–184; stängs vid path-byte rad 161–164.
- `SidebarContent` rad 307–402: rolletikett (`roleLabel`) rad 340–345, nav rad 347–366, fot rad 368–400 med Inställningar-länk, Logga ut (POST `/api/auth/logout` + `router.replace("/login")` rad 321–325) och user-block (avatar 36 px med `initials()` rad 405–410, namn, e-post) i en `rounded-xl border`.
- Layout-gate `src/app/dashboard/layout.tsx` rad 18–25: session, `mustChangePassword` → `/byt-losenord`, reviewer → egen hem, `lockToSettings = await needsDetailsReview(user)`; skickar `{ name, email, orgName, role }` till shellen rad 28–38.

**Kit** — `src/components/dashboard/ui.tsx`
- `DASHBOARD_CANVAS = "mx-auto w-full min-w-0 max-w-[1240px] px-4 sm:px-6"` rad 134–135; `DashboardPage` lägger på `py-8 sm:px-8` rad 143–149. `DASHBOARD_SPLIT` rad 140–141 använder container query (`@4xl`) på `<main class="@container">`.
- `PageHeader` rad 108–130: `border-b pb-5`, `h1 font-display text-2xl sm:text-3xl`, subtitle `text-sm text-muted`, `actions` till höger.
- `StatCard` rad 151–174: `rounded-2xl border p-5`, label `text-xs uppercase tracking-wide text-muted`, value `font-display mt-3 text-2xl`, `hint` `text-xs text-muted`, valfri ikon.
- `EmptyState` rad 176–197: `border-dashed bg-faint/50 py-16 text-center`, titel + beskrivning + action.
- `Section` rad 199–217: `mt-10`, `h2 font-display text-xl` med `border-b pb-3`.
- List-tokens: `CLICK_ROW` rad 6, `LIST_SHELL` rad 9, `LIST_HEAD` rad 15–16 (`grid h-8 … text-[9px] uppercase`), `LIST_ROW` rad 23 (`grid h-10 … border-t`), `LIST_LEAD` rad 26, `LIST_NAME` rad 29 (`text-[12px] font-medium`), `LIST_CELL` rad 32, `LIST_NUM` rad 35–36 (`tabular-nums`), `LIST_META` rad 39, kolumnmallar rad 42–79. `<table>`-tvilling `LIST_TABLE/TH/TD/TR` rad 83–87.
- `STRETCH_HREF = "after:absolute after:inset-0 after:z-0 focus-visible:relative focus-visible:z-10"` rad 102–103 och `NESTED_HIT = "relative z-10"` rad 106. Kommentaren rad 3–5 och 100–101 är kontraktet: stretch-länk **bara på `div`/`li`**, aldrig `<tr>` — Safari ignorerar `position: relative` på `<tr>` så overlayn täcker hela sidan.

**Hem** — `src/app/dashboard/page.tsx`
- `NeedsAttentionBox` rad 98–115: rubrik `text-xs uppercase text-red-700`, box `rounded-2xl border-red-200 bg-red-50`, `<ul class="divide-y divide-red-100">`. Renderas **bara** när det finns konkreta, länkbara problem (kommentar rad 95–97). Raderna rad 464–481: `<Link>` med label `text-sm font-medium text-red-950`, detail `text-xs text-red-700/80`, pil.
- `StatusInfoBox` rad 118–135: samma anatomi, neutral (`border-line bg-faint/60`) — "inget du behöver göra".
- `QuickLinks` rad 1159–1174: `grid gap-3 sm:grid-cols-3`, kort `card-lift rounded-2xl border px-5 py-4 text-sm font-medium` med pil.
- Ordning per roll: StatCards → NeedsAttention → StatusInfo → lista → QuickLinks.

**Övrigt UI**
- `src/components/ui/badge.tsx`: `Badge` rad 18–38 (`rounded-full border px-2 text-[9px] uppercase`), toner rad 8–16. `StatusHint` rad 57–61, `hintFromBooking` rad 79–93, `campaignListFilter` rad 118–140 (prioritet: avbruten → utkast → klar → **väntar material** → **åtgärda material** → godkänt → ej påbörjad → aktiv), `statusTone` rad 142–163, `statusLabel` rad 165–190 ("Väntar på material" före DB-status).
- `src/components/ui/button.tsx`: `Button` rad 36–59 (default `type="button"`), `ButtonLink` rad 61–94 som använder `<a>` för `/api/`-hrefs så `<Link>` inte prefetchar PDF-endpoints.
- `src/components/ui/disclosure.tsx`: `<details>/<summary>`-baserad.
- OBS: `steps.tsx`, `toast.tsx`, `back-link.tsx` ligger i `src/components/`, inte `src/components/ui/`. `StepIndicator` (`src/components/steps.tsx` rad 12–53): `<ol>` med 28 px cirklar, aktiv `bg-black text-white`, klar `bg-accent`. `ToastProvider/useToast` (`src/components/toast.tsx` rad 18–71): context, 4,2 s auto-dismiss, `role="alert"`/`"status"`. `BackLink` (`src/components/back-link.tsx`): `router.back()` med fallback.

## Vad Aqua har idag

**Shell** — `src/ui/shell/AppShell.tsx`
- Props `{ title, nav: DashNavMother[], email, role, dense }` rad 21–35. Nav är **grupperad** (`DashNavMother = { id, label, children: DashNavChild[] }`, `DashNavChild = { href, label, badge? }` rad 18–19) och definieras **inline i varje layout**: `src/app/(konto)/konto/layout.tsx` rad 17–47, `src/app/(operations)/operations/layout.tsx` rad 13–63, `src/app/(labels)/labels/layout.tsx` rad 14–25, `src/app/(bottler)/bottler/layout.tsx` rad 14–28. Fyra kopior, ingen central definition.
- `ROLE_LABEL` rad 9–16 mappar CUSTOMER/AQUA_STAFF/AQUA_ADMIN/LABEL/BOTTLER/FACTORY.
- Desktop-aside `av-shell-aside hidden md:flex` rad 40 — `width: 244px`, bakgrund `#f3f1eb`, i flex-flöde (inte fixed) (`tokens.css` rad 330–336). Sök-formulär mot `/operations/sok` visas när `title` är "Master Dashboard"/"Operations"/"Admin"/"Drift" (rad 36, 47–60) — stringmatch på titel, inte på roll.
- `DashNav` rad 130–163: grupper `av-nav-group`, bare-grupper (`children.length === 1`) utan rubrik, `av-nav-label`, `av-nav-link` med `is-active` och `aria-current`, `av-nav-badge`. `childActive()` rad 118–128 hanterar `?phase=`, rot-exakthet och `/konto/ordrar/ny`-specialfall. Aktiv = vit bakgrund + 2 px accentstreck till vänster (`tokens.css` rad 449–464). Länkhöjd 32 px, `--dense` 48 px (rad 423–470).
- Fot `av-shell-foot` rad 64–72: rolletikett, e-post, Logga ut via server action `logoutAction`. **Ingen** avatar, **ingen** Inställningar-länk (finns bara som nav-post i ops-layouten rad 58–62).
- Mobil rad 76–104: `header.av-shell-mobile md:hidden` (sticky, `tokens.css` rad 522–529) med logo, Logga ut och **hela navet utfällt** som wrap-flex (`av-nav--mobile`, rad 387–392) + sök. Ingen tabbar, ingen drawer, ingen aktiv sektionsrubrik.
- `<main>` rad 105–107: `max-w-7xl` (1280 px), padding `px-4 py-6 md:px-8 md:py-8` eller dense `px-3 py-5 md:px-6 md:py-7`.

**Kit** — `src/ui/shell/primitives.tsx` (exakta exporter)
- `StatusChip` rad 5–28 (tone via `statusTone()` i `src/domain/enums.ts` rad 203–225 → `done/next/blocked/idle`; label default `eventLabel(status)`).
- `RowHit` rad 30–36 (`<Link class="av-row-hit">`), `DashPage` rad 38–40 (`av-dash-page`, flex-col gap 1.75rem), `KpiStrip` rad 42–48 (`--av-kpi-cols`), `KpiCard` rad 50–64 (`av-kpi-item`, valfri `href`), `ActionList` rad 66–68, `ActionCard` rad 70–92 (`av-action-row is-{green|yellow|red|grey}`, label/detail/value), `NextStep` rad 94–121 (`av-next is-{next|done|blocked}` med fast rubrik "Vad behöver du göra nu?"), `EmptyState` rad 123–139 (`av-empty`, **ingen** dashed border), `PageHeader` rad 141–159 (`av-page-header`, `title: string`, `action` singular), `Panel` rad 161–168, `ActionRow` rad 170–177, `DashList` rad 179–181, `DashRow` rad 200–233, `Field` rad 235–242, `Timeline` rad 244–276, `DataTable`/`DataRow` rad 278–307, `DashTable` rad 309–337 (`av-table-wrap` + `av-table`, sticky `th`), `TableActions` rad 339–341, `controlClass`/`controlCompact` rad 343–347, `SectionTitle` rad 349–351, `FileLink` rad 353–359, `LinkButton` rad 380–408 (`<a>` för `/api/`-hrefs, samma idé som BBB), `Button` rad 410–422 (**saknar** default `type="button"`), `FilterChip` rad 424–447.
- Tabellklasser i `tokens.css`: `.av-table-wrap` rad 162–168 (max-height + overflow auto), `.av-table th` sticky rad 201–215, `.av-table tbody tr { position: relative }` rad 231–233, `.av-row-hit::after { position:absolute; inset:0 }` rad 248–253. Det är **exakt** den `<tr>`-stretch som BBB undviker (Safari). Används av `src/ui/ops/OrderResultsTable.tsx` rad 78–115 (`<tr>` + `RowHit` i första `<td>`).
- Motion: `src/ui/motion/Reveal.tsx` (IntersectionObserver, respekterar `prefers-reduced-motion`) används på KPI-strip i `src/app/(konto)/konto/page.tsx` rad 40–47 och `src/app/(operations)/operations/page.tsx` rad 41–48.
- Peek: `src/ui/order/OrderPeek.tsx` — `<dialog class="av-peek">` med `showModal()`, stänger på backdrop-klick, `router.push(closeHref)` när `?order=` finns. Esc sköts natively av `<dialog>`.
- Domän: `ORDER_STEPS`/`ORDER_STEP_LABELS`/`BUYER_STATUS` (`src/domain/enums.ts` rad 1–58), `orderBrief()`/`isOverdue()` (`src/domain/orderBrief.ts` rad 22–43), `buyerNextAction()` rad 111–141 (kundens "nästa steg" — redan status-först-logik, men bara för hemmets `NextStep`, inte för chips i listor). `ArtworkApproval.kind ∈ { AQUA_PROOF, CUSTOMER_FINAL }` (`prisma/schema.prisma` rad 116–119, 399–407), `ArtworkVersion` rad 386–397, `Order.requestedDate/factoryIssueNote/factoryDeadlineAccepted` rad 309, 321–322.

**Saknas jämfört med BBB**
- Central `NAV_BY_ROLE` (fyra inline-kopior idag); topbar-rubrik för undersidor (`ROUTE_TITLES`-motsvarighet).
- Mobil tabbar, drawer, Esc-stängning, `inert`, stängning vid navigering.
- User-block med avatar/initialer; Inställningar i foten (bara AQUA har en inställningssida: `src/app/(operations)/operations/installningar/page.tsx`).
- `NeedsAttention` (röd, länkade åtgärder) och `StatusInfo` (neutral) — ops-hemmet använder `ActionList/ActionCard` med `tone="red"` som närmaste motsvarighet (`operations/page.tsx` rad 66–79), kundhemmet bara `NextStep`.
- `QuickLinks`, `StatCard` med `hint`-rad (dagens `KpiCard` har label + value), `StepIndicator` (Aqua har vertikal `Timeline`), `Toast` (finns inte alls; formulär redirectar).
- `statusHint()` — chips visar DB-status (`ORDER_STEP_LABELS`) eller `BUYER_STATUS`; "saknar artwork"/"väntar på ditt godkännande" räknas ad hoc i sidorna (`konto/page.tsx` rad 19, `orderBrief.ts` rad 114–116).
- Stretch-rad som är säker i Safari.

## Ändringar

### `src/ui/shell/nav.ts` (ny) — central nav-definition
- Exportera `NavRole = "CUSTOMER" | "AQUA" | "LABEL" | "BOTTLER"`, `navRoleOf(role: string): NavRole` (AQUA_STAFF/AQUA_ADMIN → AQUA via `isAquaAdmin` i `src/domain/policies/roles.ts` rad 2–4; FACTORY → BOTTLER), `NAV_BY_ROLE: Record<NavRole, DashNavMother[]>`, `flatNav(role)` (barn i ordning → tabbar tar `slice(0, 4)`), `SETTINGS_HREF: Partial<Record<NavRole, string>>`, `ROUTE_TITLES` + `titleForPath()`.
- Grupperingen (`DashNavMother`) behålls — den är Aquas styrka på desktop. Ordningen inom gruppen och mellan grupper är också **tabbar-ordningen**, så de fyra första barnen måste vara de mest använda.
- Föreslagna listor, alla hrefs finns i `src/app` idag:

```ts
// src/ui/shell/nav.ts
export const NAV_BY_ROLE: Record<NavRole, DashNavMother[]> = {
  CUSTOMER: [
    { id: "hem", label: "Översikt", children: [{ href: "/konto", label: "Hem" }] },
    { id: "ordrar", label: "Ordrar", children: [
      { href: "/konto/ordrar", label: "Ordrar" }, { href: "/konto/ordrar/ny", label: "Ny order" } ] },
    { id: "ekonomi", label: "Ekonomi", children: [
      { href: "/konto/fakturor", label: "Fakturor" }, { href: "/konto/dokument", label: "Dokument" } ] },
    { id: "design", label: "Design", children: [
      { href: "/konto/artwork", label: "Artwork" }, { href: "/designa", label: "Design Studio" } ] },
  ],
  AQUA: [ /* Dashboard, Ordermottagning, Pipeline, Produktion | Frakt, Fakturering, Kunder, Leads,
            Etiketter (?phase=labels), Dokument, Produkter, Prislistor, Agenten, Sök */ ],
  LABEL: [ { id: "jobb", label: "Jobb", children: [{ href: "/labels", label: "Översikt" }] },
           { id: "underlag", label: "Underlag", children: [{ href: "/labels/dokument", label: "Leveransrapport" }] } ],
  BOTTLER: [ { id: "jobb", label: "Jobb", children: [
               { href: "/bottler", label: "Översikt" }, { href: "/bottler/skickat", label: "Skickat" } ] },
             { id: "underlag", label: "Underlag", children: [{ href: "/bottler/dokument", label: "Dokument" }] } ],
};
export const SETTINGS_HREF: Partial<Record<NavRole, string>> = { AQUA: "/operations/installningar" };
```

- AQUA-tabbar blir därmed Dashboard · Ordermottagning · Pipeline · Produktion; resten under "Mer". `/operations/installningar` flyttas från nav-gruppen "System" (`operations/layout.tsx` rad 58–62) till foten. Inga nya routes uppfinns här; om 07/08 vill ha `/konto/installningar` läggs den i `SETTINGS_HREF` då.

### `src/ui/shell/AppShell.tsx`
- Props: ersätt `nav: DashNavMother[]` med `role: string` (nav hämtas via `NAV_BY_ROLE[navRoleOf(role)]`), behåll `title`, `email`, `dense`; lägg till `name?: string | null`. `showSearch` byts från titel-stringmatch (rad 36) till `navRoleOf(role) === "AQUA"`.
- Desktop-aside: samma bredd 244 px (`av-shell-aside`), men **fixed** (`md:fixed md:inset-y-0`) och main får `md:pl-[244px]` — som BBB rad 208/298 så scroll aldrig flyttar sidomenyn. Aktiv länk behåller Aquas vita platta + accentstreck (inte BBB:s svart).
- Fot: `Inställningar`-länk när `SETTINGS_HREF[navRole]` finns, `Logga ut` (samma `logoutAction`), sedan user-block (`av-user-block`: 36 px avatar med `initials(name ?? email)`, namn, e-post, rolletikett). `initials()` kopieras från BBB rad 405–410 (fallback "AV").
- Mobil, ersätter rad 76–104:
  - Topbar `av-topbar` (fixed, `h-14`, `safe-area-inset-top`): `titleForPath(pathname)` eller aktiv nav-label; avatar-knapp öppnar drawern (`aria-expanded`, `aria-controls="av-drawer"`).
  - Tabbar `av-tabbar` (fixed bottom, `h-16`, `safe-area-inset-bottom`): `flatNav(role).slice(0, 4)` + "Mer"-knapp; aktiv `aria-current="page"`. Etikett = nav-label, ingen ikon (ingen lucide); LABEL/BOTTLER med ≤ 3 poster visar dem alla utan "Mer" — tabbar är då hela navet.
  - Drawer `av-drawer` (`w-72`, overlay stänger, `inert` när stängd): återanvänder `DashNav` + foten. `useEffect` på `pathname` stänger; `keydown Escape` stänger (BBB rad 161–184). Sök-formuläret för AQUA hamnar i drawern.
  - Main-wrapper får `pt-14 pb-16 md:pt-0 md:pb-0` (BBB rad 298).
- `DashNav` behålls, men `childActive()` (rad 118–128) exporteras så tabbar och topbar använder samma aktiv-logik.
- Layouts (`konto/layout.tsx`, `operations/layout.tsx`, `labels/layout.tsx`, `bottler/layout.tsx`) tappar sina inline-`nav`-arrayer och skickar `role`, `name`, `email`, `title`. Gaten (`requireRole` / `requireSupplier`) ändras inte.

### `src/ui/shell/primitives.tsx`
- **Nytt** `NeedsAttention({ title = "Kräver åtgärd", items })`, `items: { key, href, label, detail? }[]`. Renderar **ingenting** vid tom lista (BBB-regeln rad 95–97). Klasser `av-attention`, `av-attention-row`. Rött via `--av-status-blocked-*`, aldrig hårdkodad hex.
- **Nytt** `StatusInfo({ title, items })` — samma anatomi, neutral (`av-status-info`).
- **Nytt** `QuickLinks({ links: { href, label }[] })` — `av-quicklinks`, 3 kolumner ≥ 640 px, kort med pil (text "→" eller inline-SVG).
- **Justera** `KpiCard`: lägg till `hint?: string` (tredje rad `av-kpi-hint`, 12 px muted) så KPI kan säga "2 väntar på dig". Namnet behålls (ingen rename till `StatCard`; `StatCard` exporteras som alias för 07/08:s läsbarhet).
- **Nytt** `StepIndicator({ steps: { id, label }[], current, done? })` — horisontell variant av `Timeline` för orderflödets 3–4 steg (kassa → artwork → korrektur → OB). `av-steps`.
- **Nytt** `Drawer`/`Topbar`/`Tabbar` som interna komponenter i `AppShell.tsx`, **inte** exporterade från primitives (bara shellen äger dem).
- **Justera** `Button` (rad 410–422): default `type="button"` som BBB rad 49.
- **Justera** `PageHeader` (rad 141–159): `title: ReactNode`, `actions?: ReactNode` (behåll `action` som alias en release).
- **Toast**: skippas i V1. Aqua har inget toast-behov idag — alla mutationer är server actions med redirect, och `NextStep`/`NeedsAttention` bär bekräftelsen. Om 07/08 behöver det: `ToastProvider/useToast` i `src/ui/shell/toast.tsx` efter BBB `src/components/toast.tsx` rad 18–71, monterad i `AppShell`.
- **Stretch-rad**: `DashTable`/`RowHit` behålls för täta sorterbara tabeller, men `.av-row-hit::after` på `<tr>` måste verifieras i Safari (BBB `ui.tsx` rad 3–5). Faller den: nytt `ListRow`/`ListHead` (CSS-grid, `av-list-row`/`av-list-head`, radhöjd 40 px, head 32 px, `text-[11px]`) med `STRETCH_HREF`/`NESTED_HIT`-motsvarigheter `av-stretch`/`av-nested`, och `OrderResultsTable.tsx`, `LabelJobsTable.tsx`, `BottlerJobsTable.tsx`, `BuyerOrderCard.tsx` migreras dit i 07/08.

### `src/domain/statusHint.ts` (ny)
- Ren funktion, inga imports från `src/ui` eller Prisma-klienten. Mappar `OrderStatusCode` + fakta till **nästa steg** per roll — samma prioritetsidé som BBB `campaignListFilter` rad 118–140: blockerat → väntar på dig → väntar på annan → klart.

```ts
// src/domain/statusHint.ts
import type { OrderStatusCode } from "./enums";
import { isOverdue } from "./orderBrief";
export type HintFacts = { hasArtwork: boolean; customerApproved: boolean;
  requestedDate?: string | null; factoryIssueNote?: string | null; factoryDeadlineAccepted?: boolean };
export type Hint = { label: string; tone: "done" | "next" | "blocked" | "idle" };
export function statusHint(status: OrderStatusCode, f: HintFacts, viewer: NavRole): Hint {
  if (f.factoryIssueNote && !f.factoryDeadlineAccepted) return { label: "Problem flaggat", tone: "blocked" };
  if (isOverdue(status, f.requestedDate)) return { label: "Försenad", tone: "blocked" };
  if (["SUBMITTED", "AQUA_REVIEW"].includes(status) && !f.hasArtwork)
    return { label: viewer === "CUSTOMER" ? "Ladda upp artwork" : "Saknar artwork", tone: "blocked" };
  if (status === "ARTWORK_CUSTOMER_APPROVAL" && !f.customerApproved)
    return { label: viewer === "CUSTOMER" ? "Godkänn korrektur" : "Väntar på kund", tone: viewer === "CUSTOMER" ? "next" : "idle" };
  return { label: viewer === "CUSTOMER" ? BUYER_STATUS[status] : ORDER_STEP_LABELS[status], tone: statusTone(status, f.requestedDate) };
}
```

- `hasArtwork` = `artworkVersions.length > 0` eller `orderArtworkLink()` (`src/domain/orderArtwork.ts`) ≠ null; `customerApproved` = någon `ArtworkApproval` med `kind === "CUSTOMER_FINAL"` (samma test som `buyerNextAction` rad 115). LABEL/BOTTLER går via `FACTORY_JOB_LABELS`-grenen och får aldrig fakturastatus.
- `StatusChip` får `hint?: Hint`-prop och använder `hint.label/tone` när den finns; `buyerNextAction()` skrivs om att använda `statusHint` så hemmets `NextStep` och listornas chips aldrig säger olika saker.

### Tokens som behövs (namn — definieras i 05)
`.av-topbar`, `.av-tabbar`, `.av-tab`, `.av-tab.is-active`, `.av-drawer`, `.av-drawer-overlay`, `.av-drawer-panel`, `.av-user-block`, `.av-avatar`, `.av-attention`, `.av-attention-row`, `.av-status-info`, `.av-quicklinks`, `.av-quicklink`, `.av-kpi-hint`, `.av-steps`, `.av-step`, `.av-list-head`, `.av-list-row`, `.av-stretch`, `.av-nested`, samt `--av-shell-w: 244px`, `--av-topbar-h: 3.5rem`, `--av-tabbar-h: 4rem`. Befintliga `.av-shell-mobile`, `.av-nav--mobile` tas bort när drawern är inne.

### Migrering av befintliga sidor
1. Layouts → `role/name/email/title` (4 filer, mekaniskt).
2. `konto/page.tsx`, `operations/page.tsx`, `SupplierDesk.tsx`: byt inline-ad-hoc-status till `statusHint`; lägg `NeedsAttention` **ovanför** KPI-strip; `QuickLinks` sist. Innehållet per roll ägs av 07/08 — här bara komponentbyte.
3. `OrderResultsTable.tsx`, `BuyerOrderTable` (`src/ui/order/BuyerOrderCard.tsx`), `LabelJobsTable.tsx`, `BottlerJobsTable.tsx`: `StatusChip hint={statusHint(...)}`.
4. `Reveal` fortsätter wrappa KPI-strip och `NeedsAttention` (samma stagger).

## Kontraktskontroll

- **Roller**: `navRoleOf()` är den enda platsen som kollapsar AQUA_STAFF/AQUA_ADMIN (via `isAquaAdmin`) och FACTORY → BOTTLER. Gaten förblir `requireRole(["CUSTOMER","AQUA_STAFF","AQUA_ADMIN"])` (`konto/layout.tsx` rad 8), `requireRole(["AQUA_STAFF","AQUA_ADMIN"])` (`operations/layout.tsx` rad 7), `requireSupplier("label"|"bottler")` (`labels/layout.tsx` rad 7, `bottler/layout.tsx` rad 7; `src/server/supplierAccess.ts` rad 7–20). Shellen gör **ingen** auktorisation — den ritar bara nav för den roll servern redan verifierat.
- **Ingen kr hos etikett/bottler**: `NAV_BY_ROLE.LABEL/BOTTLER` innehåller inga ekonomi-routes; `statusHint` för LABEL/BOTTLER går via `FACTORY_JOB_LABELS` och returnerar aldrig `INVOICED/PAID`-etiketter; `KpiCard hint` får inte ta emot belopp på `/labels`/`/bottler` (08 verifierar). `NeedsAttention`-items för leverantörer länkar bara inom `/labels` resp. `/bottler`.
- **Publik katalog**: shellen används bara under `(konto)`, `(operations)`, `(labels)`, `(bottler)` — `(public)`-layouten rörs inte.
- **Inga nya paket**: allt är React + Tailwind v4 + `tokens.css`. Drawer bygger på `useState` + `inert`; peek fortsätter på `<dialog>`. Ingen lucide, ingen radix, ingen framer.
- **Pris/orderkontrakt**: fil 06 rör inte prisberäkning, snapshots eller ordertransitions. `statusHint` läser status och fakta, skriver aldrig.
- **Mejl/irreversibla knappar**: shell och kit innehåller inga knappar som fakturerar, markerar betald eller skickar mejl.

## Acceptanskriterier

- [ ] Samma shell-mått på alla fyra dashboards: aside 244 px fixed på ≥ 768 px, main `pl-244px`, topbar 56 px och tabbar 64 px på < 768 px. Verifieras genom att `/konto`, `/operations`, `/labels`, `/bottler` renderar `AppShell` med enbart `role`-styrd nav.
- [ ] `NAV_BY_ROLE` är den enda nav-definitionen; `rg "children: \[" src/app` ger 0 träffar i layouts.
- [ ] Mobil 390 px (iPhone 12/13/14): inget horisontellt overflow på hemmet, orderlistan och en orderdetalj för varje roll; topbar visar rätt sektionsnamn på undersidor (t.ex. `/konto/ordrar/AV-…` → "Ordrar").
- [ ] Tabbar visar 4 poster + "Mer" för CUSTOMER och AQUA; LABEL (2) och BOTTLER (3) visar alla poster utan "Mer". Aktiv flik har `aria-current="page"`.
- [ ] Drawer: öppnas från avatar och "Mer", stängs med Esc, overlay-klick, stängknapp och vid navigering; `inert` när stängd så tab-fokus aldrig hamnar i den.
- [ ] Tab-navigering: fokusordning topbar → main → tabbar; alla nav-länkar och knappar har synlig `focus-visible`-ring (`--av-accent`); user-block-knappen har `aria-label`.
- [ ] Foten visar Inställningar bara för AQUA (`/operations/installningar`), Logga ut för alla, user-block med initialer/namn/e-post/roll för alla.
- [ ] `NeedsAttention` renderar inget DOM vid tom lista; `StatusInfo` likaså.
- [ ] `statusHint()` har enhetstest (`src/domain/statusHint.test.ts`, samma stil som `exceptions.test.ts`) för: saknad artwork, väntar på kundgodkännande (kund vs Aqua), försenad, flaggad, LABEL/BOTTLER får aldrig `Fakturerad/Betald`.
- [ ] `/labels` och `/bottler`: `rg -n "kr\b" src/app/\(labels\) src/app/\(bottler\) src/ui/supplier` ger 0 träffar i renderad text.
- [ ] Safari (macOS + iOS): klick på en rad i `OrderResultsTable` öppnar rätt order och inget annat på sidan täcks av `::after`. Annars aktiveras grid-rad-fallbacken.
- [ ] `prefers-reduced-motion`: drawer/tabbar utan transition, `Reveal` visar direkt.
- [ ] `npm run build` grönt; `av-bug-hunter-prepush` utan CRITICAL/HIGH före push (regel `prepush-bughunt.mdc`).

## Beroenden

- **Kräver 05** (CSS-tokens): alla `.av-topbar/.av-tabbar/.av-drawer/.av-attention/.av-quicklinks/.av-kpi-hint/.av-steps/.av-list-*`-klasser och `--av-shell-w/--av-topbar-h/--av-tabbar-h` måste finnas i `tokens.css` innan shell-ändringen mergas. 06 namnger, 05 definierar.
- **07 (kundportalens hem/orderhub) och 08 (operations/labels/bottler-hemmen) bygger på 06**: de använder `NeedsAttention`, `StatusInfo`, `QuickLinks`, `KpiCard hint`, `StepIndicator`, `statusHint` och `NAV_BY_ROLE` — de definierar **innehållet** (vilka åtgärder, vilka KPI) men inte komponenterna.
- Ingen påverkan på `Skyltochgravyr/skyltmotor/`.

## Uppskattad storlek

- `nav.ts` (ny, ~90 rader), `statusHint.ts` + test (ny, ~120 rader), `AppShell.tsx` (omskrivning ~250 rader, från 163), `primitives.tsx` (+~150 rader), 4 layouts (−~120 rader), tokens-namn till 05.
- Ca **1,5–2 arbetsdagar** inklusive Safari/iOS-verifiering; 07 och 08 kan börja parallellt när `nav.ts`, `statusHint.ts` och primitives-signaturerna är låsta (dag 1 förmiddag).
