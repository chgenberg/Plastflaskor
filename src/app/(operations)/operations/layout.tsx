import { requireRole } from "@/server/rbac";
import { unreadCountFor } from "@/server/services/notify";
import { AppShell } from "@/ui/shell/AppShell";

export const dynamic = "force-dynamic";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["AQUA_STAFF", "AQUA_ADMIN"]);
  const unread = await unreadCountFor(user.id);
  return (
    <AppShell
      title="Operations"
      email={user.email}
      role={user.role}
      nav={[
        { href: "/operations", label: "Idag" },
        { href: "/operations/pipeline", label: "Pipeline" },
        { href: "/operations/ordrar", label: "Ordrar" },
        { href: "/operations/produktion", label: "Produktion" },
        { href: "/operations/etiketter", label: "Etiketter" },
        { href: "/operations/ekonomi", label: "Ekonomi" },
        { href: "/operations/ledning", label: "Ledning" },
        { href: "/operations/sok", label: "Sök" },
        { href: "/operations/notiser", label: "Notiser", badge: unread || undefined },
      ]}
    >
      {children}
    </AppShell>
  );
}
