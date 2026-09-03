import { requireRole } from "@/server/rbac";
import { getCustomerName } from "@/server/services/customer.service";
import { AppShell } from "@/ui/shell/AppShell";

export const dynamic = "force-dynamic";

export default async function KontoLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const customerName = user.customerId ? await getCustomerName(user.customerId) : null;
  return (
    <AppShell title={customerName ?? "Kundportal"} email={user.email} role={user.role} name={user.name}>
      {children}
    </AppShell>
  );
}
