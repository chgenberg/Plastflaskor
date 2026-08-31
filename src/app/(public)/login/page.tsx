import { loginAction } from "@/actions";
import { getSessionUser, homeForRole } from "@/server/rbac";
import { safeInternalPath } from "@/domain/safePath";
import { redirect } from "next/navigation";
import { PageIntro } from "@/ui/public/PageIntro";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const user = await getSessionUser();
  const dest = safeInternalPath(next, homeForRole(user?.role ?? "PUBLIC"));
  if (user) redirect(dest);

  return (
    <main className="mx-auto max-w-md px-4 pb-20 pt-36">
      <div className="rounded-[28px] bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <PageIntro title="Logga in" />
        {error ? <p className="mt-3 text-sm text-[var(--av-status-blocked-fg)]">Fel e-post, lösenord eller behörighet.</p> : null}
        <form action={loginAction} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={safeInternalPath(next, "")} />
          <label className="block text-sm">
            Användarnamn eller e-postadress
            <input required name="email" type="email" className="mt-1 h-12 w-full rounded-full border border-[var(--av-border)] px-4" />
          </label>
          <label className="block text-sm">
            Lösenord
            <input required name="password" type="password" className="mt-1 h-12 w-full rounded-full border border-[var(--av-border)] px-4" />
          </label>
          <button type="submit" className="h-[52px] w-full rounded-full bg-[#1d1d1f] text-sm font-semibold text-white">
            Logga in
          </button>
        </form>
        <p className="mt-6 text-xs text-[var(--av-text-muted)]">
          Demo: kund@demo.aqua · reseller.gold@demo.aqua · staff@demo.aqua · factory@demo.aqua (leverantör) · AquaDemo26!
        </p>
      </div>
    </main>
  );
}
