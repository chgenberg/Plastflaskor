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
        {
          id: "oversikt",
          label: "Översikt",
          children: [
            { href: "/operations", label: "Dashboard" },
            { href: "/operations/agenten", label: "Agenten" },
          ],
        },
        {
          id: "ordrar",
          label: "Ordrar",
          children: [
            { href: "/operations/ordrar", label: "Ordermottagning" },
            { href: "/operations/pipeline", label: "Pipeline" },
            { href: "/operations/leads", label: "Leads" },
          ],
        },
        {
          id: "produktion",
          label: "Produktion",
          children: [
            { href: "/operations/produktion", label: "Produktion" },
            { href: "/operations/ordrar?phase=labels", label: "Etiketter" },
            { href: "/operations/frakt", label: "Frakt" },
          ],
        },
        {
          id: "ekonomi",
          label: "Ekonomi",
          children: [{ href: "/operations/ekonomi", label: "Fakturering" }],
        },
        {
          id: "register",
          label: "Register",
          children: [
            { href: "/operations/kunder", label: "Kunder" },
            { href: "/operations/produkter", label: "Produkter" },
            { href: "/operations/priser", label: "Prislistor" },
          ],
        },
        {
          id: "system",
          label: "System",
          children: [{ href: "/operations/installningar", label: "Inställningar" }],
        },
      ]}
    >
      {children}
    </AppShell>
  );
}
