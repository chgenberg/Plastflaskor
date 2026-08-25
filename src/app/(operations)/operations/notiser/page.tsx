import { getSessionUser } from "@/server/rbac";
import { getIntegrations } from "@/server/integrations/composition";
import { prisma } from "@/server/db";
import { EmptyState, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  const items = user ? await getIntegrations().notifications.listForUser(user.id) : [];
  if (user) {
    await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  }
  return (
    <div className="space-y-8">
      <PageHeader title="Notiser" subtitle="Meddelanden kopplade till ditt konto." />
      {items.length === 0 ? (
        <EmptyState title="Inga notiser" body="När något behöver din uppmärksamhet syns det här." />
      ) : (
        <Panel padded={false}>
          <ul className="divide-y divide-black/5">
            {items.map((n) => (
              <li key={n.id} className="px-5 py-3">
                <p className="font-medium">{n.title}</p>
                <p className="mt-1 text-sm text-[#6b7280]">{n.body}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
