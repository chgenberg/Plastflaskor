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
        {
          id: "jobb",
          label: "Jobb",
          children: [{ href: "/labels", label: "Översikt" }],
        },
        {
          id: "underlag",
          label: "Underlag",
          children: [{ href: "/labels/dokument", label: "Leveransrapport" }],
        },
      ]}
    >
      {children}
    </AppShell>
  );
}
