import { requireSupplier } from "@/server/supplierAccess";
import { AppShell } from "@/ui/shell/AppShell";

export const dynamic = "force-dynamic";

export default async function LabelsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSupplier("label");
  return (
    <AppShell
      title="Etikett"
      email={user.email}
      role={user.role}
      dense
      nav={[
        { href: "/labels", label: "Översikt" },
        { href: "/labels/dokument", label: "Dokument" },
      ]}
    >
      {children}
    </AppShell>
  );
}
