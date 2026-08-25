import { getSessionUser } from "@/server/rbac";
import { getIntegrations } from "@/server/integrations/composition";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  const items = user ? await getIntegrations().notifications.listForUser(user.id) : [];
  return (
    <div>
      <h1 className="text-3xl font-semibold">Notifieringar</h1>
      <ul className="mt-6 divide-y rounded-2xl bg-white">
        {items.map((n) => (
          <li key={n.id} className="px-4 py-3">
            <p className="font-medium">{n.title}</p>
            <p className="text-sm text-[var(--av-text-secondary)]">{n.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
