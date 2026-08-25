import { requireRole } from "@/server/rbac";
import { AppShell } from "@/ui/shell/AppShell";

export default async function FactoryLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]);
  return (
    <AppShell
      title="Fabriken"
      email={user.email}
      nav={[
        { href: "/factory", label: "Idag" },
        { href: "/factory/skickat", label: "Skickat" },
        { href: "/factory/dokument", label: "Dokument" },
      ]}
    >
      {children}
    </AppShell>
  );
}
