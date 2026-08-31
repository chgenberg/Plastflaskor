import { getSessionUser } from "@/server/rbac";
import { getIntegrations } from "@/server/integrations/composition";
import { prisma } from "@/server/db";
import { EmptyState, PageHeader } from "@/ui/shell/primitives";

const CARD = "av-card p-5";

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
        <div className="space-y-4">
          {items.map((n) => (
            <article key={n.id} className={CARD}>
              <p className="font-medium">{n.title}</p>
              <p className="mt-1 text-sm text-[var(--av-text-muted)]">{n.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
