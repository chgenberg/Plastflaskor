import { requireRole } from "@/server/rbac";
import { AppShell } from "@/ui/shell/AppShell";

export const dynamic = "force-dynamic";

export default async function FactoryLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]);
  return (
    <AppShell
      title="Leverantör"
      email={user.email}
      role={user.role}
      dense
      nav={[
        { href: "/factory", label: "Översikt" },
        { href: "/factory/skickat", label: "Skickat" },
        { href: "/factory/dokument", label: "Dokument" },
      ]}
    >
      {children}
    </AppShell>
  );
}
