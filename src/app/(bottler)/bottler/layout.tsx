import { requireSupplier } from "@/server/supplierAccess";
import { AppShell } from "@/ui/shell/AppShell";

export const dynamic = "force-dynamic";

export default async function BottlerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSupplier("bottler");
  return (
    <AppShell title="Bottler" email={user.email} role={user.role} name={user.name} dense>
      {children}
    </AppShell>
  );
}
