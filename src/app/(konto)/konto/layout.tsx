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
        { href: "/konto", label: "Översikt" },
        { href: "/konto/ordrar", label: "Ordrar" },
        { href: "/konto/ordrar/ny", label: "Ny order" },
        { href: "/designa", label: "Design Studio" },
        { href: "/konto/artwork", label: "Artwork" },
        { href: "/konto/fakturor", label: "Fakturor" },
        { href: "/konto/dokument", label: "Dokument" },
      ]}
    >
      {children}
    </AppShell>
  );
}
