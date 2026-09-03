import { requireRole } from "@/server/rbac";
import { AppShell } from "@/ui/shell/AppShell";

export const dynamic = "force-dynamic";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["AQUA_STAFF", "AQUA_ADMIN"]);
  return (
    <AppShell title="Master Dashboard" email={user.email} role={user.role} name={user.name}>
      {children}
    </AppShell>
  );
}
