import { requireRole } from "@/server/rbac";
import { AppShell } from "@/ui/shell/AppShell";

export const dynamic = "force-dynamic";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["AQUA_STAFF", "AQUA_ADMIN"]);
  return (
    <AppShell
      title="Drift"
      email={user.email}
      role={user.role}
      nav={[
        { href: "/operations", label: "Dashboard" },
        { href: "/operations/ordrar", label: "Ordrar" },
        { href: "/operations/pipeline", label: "Pipeline" },
        { href: "/operations/leads", label: "Leads" },
        { href: "/operations/produktion", label: "Produktion" },
        { href: "/operations/frakt", label: "Frakt" },
        { href: "/operations/ekonomi", label: "Fakturering" },
        { href: "/operations/kunder", label: "Kunder" },
        { href: "/operations/produkter", label: "Produkter" },
        { href: "/operations/priser", label: "Prislistor" },
        { href: "/operations/installningar", label: "Inställningar" },
      ]}
    >
      {children}
    </AppShell>
  );
}
