import { requireRole } from "@/server/rbac";
import { AppShell } from "@/ui/shell/AppShell";

export const dynamic = "force-dynamic";

export default async function KontoLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  return (
    <AppShell
      title="Kundportal"
      email={user.email}
      role={user.role}
      nav={[
        {
          id: "oversikt",
          label: "Översikt",
          children: [{ href: "/konto", label: "Hem" }],
        },
        {
          id: "ordrar",
          label: "Ordrar",
          children: [
            { href: "/konto/ordrar", label: "Alla ordrar" },
            { href: "/konto/ordrar/ny", label: "Ny order" },
          ],
        },
        {
          id: "design",
          label: "Design",
          children: [
            { href: "/designa", label: "Design Studio" },
            { href: "/konto/artwork", label: "Artwork" },
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
      ]}
    >
      {children}
    </AppShell>
  );
}
