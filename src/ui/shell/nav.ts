import { navRoleOf, type NavRole } from "@/domain/navRole";

export type { NavRole };
export { navRoleOf };

export type DashNavChild = { href: string; label: string; badge?: number };
export type DashNavMother = { id: string; label: string; children: DashNavChild[] };

export const NAV_BY_ROLE: Record<NavRole, DashNavMother[]> = {
  CUSTOMER: [
    { id: "hem", label: "Översikt", children: [{ href: "/konto", label: "Hem" }] },
    {
      id: "ordrar",
      label: "Ordrar",
      children: [
        { href: "/konto/ordrar", label: "Ordrar" },
        { href: "/konto/ordrar/ny", label: "Ny order" },
      ],
    },
    {
      id: "ekonomi",
      label: "Ekonomi",
      children: [
        { href: "/konto/fakturor", label: "Fakturor" },
        { href: "/konto/dokument", label: "Dokument" },
      ],
    },
    {
      id: "design",
      label: "Design",
      children: [
        { href: "/konto/artwork", label: "Artwork" },
        { href: "/designa", label: "Design Studio" },
      ],
    },
  ],
  AQUA: [
    {
      id: "oversikt",
      label: "Översikt",
      children: [
        { href: "/operations", label: "Dashboard" },
        { href: "/operations/ordrar", label: "Ordermottagning" },
        { href: "/operations/pipeline", label: "Pipeline" },
        { href: "/operations/produktion", label: "Produktion" },
      ],
    },
    {
      id: "produktion",
      label: "Produktion",
      children: [
        { href: "/operations/ordrar?phase=labels", label: "Etiketter" },
        { href: "/operations/frakt", label: "Frakt" },
      ],
    },
    {
      id: "ekonomi",
      label: "Ekonomi",
      children: [
        { href: "/operations/ekonomi", label: "Fakturering" },
        { href: "/operations/dokument", label: "Dokument" },
      ],
    },
    {
      id: "register",
      label: "Register",
      children: [
        { href: "/operations/kunder", label: "Kunder" },
        { href: "/operations/leads", label: "Leads" },
        { href: "/operations/produkter", label: "Produkter" },
        { href: "/operations/priser", label: "Prislistor" },
      ],
    },
    {
      id: "system",
      label: "System",
      children: [
        { href: "/operations/agenten", label: "Agenten" },
        { href: "/operations/ordrar/ny", label: "Ny order" },
      ],
    },
  ],
  LABEL: [
    { id: "jobb", label: "Jobb", children: [{ href: "/labels", label: "Översikt" }] },
    { id: "underlag", label: "Underlag", children: [{ href: "/labels/dokument", label: "Leveransrapport" }] },
  ],
  BOTTLER: [
    {
      id: "jobb",
      label: "Jobb",
      children: [
        { href: "/bottler", label: "Översikt" },
        { href: "/bottler/skickat", label: "Skickat" },
      ],
    },
    { id: "underlag", label: "Underlag", children: [{ href: "/bottler/dokument", label: "Dokument" }] },
  ],
};

export const SETTINGS_HREF: Partial<Record<NavRole, string>> = {
  AQUA: "/operations/installningar",
};

export const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: "Kund",
  AQUA_STAFF: "Admin",
  AQUA_ADMIN: "Admin",
  LABEL: "Etikett",
  BOTTLER: "Bottler",
  FACTORY: "Bottler",
};

export function flatNav(role: NavRole): DashNavChild[] {
  return NAV_BY_ROLE[role].flatMap((group) => group.children);
}

export const ROUTE_TITLES: { prefix: string; title: string }[] = [
  { prefix: "/konto/ordrar/ny", title: "Ny order" },
  { prefix: "/konto/ordrar", title: "Ordrar" },
  { prefix: "/konto/fakturor", title: "Fakturor" },
  { prefix: "/konto/dokument", title: "Dokument" },
  { prefix: "/konto/artwork", title: "Artwork" },
  { prefix: "/konto", title: "Hem" },
  { prefix: "/operations/ordrar/ny", title: "Ny order" },
  { prefix: "/operations/ordrar", title: "Ordermottagning" },
  { prefix: "/operations/pipeline", title: "Pipeline" },
  { prefix: "/operations/produktion", title: "Produktion" },
  { prefix: "/operations/frakt", title: "Frakt" },
  { prefix: "/operations/ekonomi", title: "Fakturering" },
  { prefix: "/operations/dokument", title: "Dokument" },
  { prefix: "/operations/kunder", title: "Kunder" },
  { prefix: "/operations/leads", title: "Leads" },
  { prefix: "/operations/produkter", title: "Produkter" },
  { prefix: "/operations/priser", title: "Prislistor" },
  { prefix: "/operations/agenten", title: "Agenten" },
  { prefix: "/operations/installningar", title: "Inställningar" },
  { prefix: "/operations/sok", title: "Sök" },
  { prefix: "/operations", title: "Dashboard" },
  { prefix: "/labels/dokument", title: "Leveransrapport" },
  { prefix: "/labels/jobb", title: "Jobb" },
  { prefix: "/labels", title: "Översikt" },
  { prefix: "/bottler/dokument", title: "Dokument" },
  { prefix: "/bottler/skickat", title: "Skickat" },
  { prefix: "/bottler/jobb", title: "Jobb" },
  { prefix: "/bottler", title: "Översikt" },
  { prefix: "/designa", title: "Design Studio" },
];

export function titleForPath(path: string, search?: { get(name: string): string | null }): string {
  if (path === "/operations/ordrar" && search?.get("phase") === "labels") return "Etiketter";
  const hit = ROUTE_TITLES.find((row) => path === row.prefix || path.startsWith(`${row.prefix}/`));
  return hit?.title ?? "Översikt";
}

export function hrefParts(href: string) {
  const [path, query] = href.split("?");
  return { path, query: new URLSearchParams(query ?? "") };
}

export function childActive(href: string, path: string, search: { get(name: string): string | null }) {
  const { path: target, query } = hrefParts(href);
  const roots = ["/operations", "/konto", "/labels", "/bottler"];
  if (query.get("phase")) {
    return path === target || path.startsWith(`${target}/`) ? search.get("phase") === query.get("phase") : false;
  }
  if (target === "/operations/ordrar" && search.get("phase") === "labels") return false;
  if (target === "/konto/ordrar" && (path === "/konto/ordrar/ny" || path.startsWith("/konto/ordrar/ny/"))) return false;
  if (roots.includes(target)) return path === target;
  return path === target || path.startsWith(`${target}/`);
}

export function initials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  if (parts[0]?.length) return parts[0].slice(0, 2).toUpperCase();
  return "AV";
}
