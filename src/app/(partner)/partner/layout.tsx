import { requireRole } from "@/server/rbac";
import { AppShell } from "@/ui/shell/AppShell";

export const dynamic = "force-dynamic";

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  return (
    <AppShell
      title="ÅF-portal"
      email={user.email}
      nav={[
        { href: "/partner", label: "Översikt" },
        { href: "/partner/priser", label: "Priser" },
        { href: "/partner/ordrar", label: "Ordrar" },
        { href: "/partner/dokument", label: "Dokument" },
        { href: "/partner/artwork", label: "Artwork" },
        { href: "/partner/konto", label: "Konto" },
      ]}
    >
      {children}
    </AppShell>
  );
}
