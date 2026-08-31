import { loginAction } from "@/actions";
import { getSessionUser, homeForRole } from "@/server/rbac";
import { safeInternalPath } from "@/domain/safePath";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const user = await getSessionUser();
  const dest = safeInternalPath(next, homeForRole(user?.role ?? "PUBLIC"));
  if (user) redirect(dest);

  return (
    <main className="mx-auto flex max-w-md flex-col justify-center px-4 pb-24 pt-16">
      <div className="mb-8 text-center">
        <Image src="/brand/aqua-visibility-logo.png" alt="aqua visibility" width={140} height={46} className="mx-auto h-9 w-auto" />
        <h1 className="mt-8 text-[28px] font-semibold tracking-tight">Kundportal</h1>
        <p className="mt-2 text-sm text-[var(--av-text-muted)]">Priser, ordrar och fakturor efter inloggning.</p>
      </div>
      <div className="av-card p-8">
        {error ? <p className="mb-4 text-sm text-[var(--av-status-blocked-fg)]">Fel e-post, lösenord eller behörighet.</p> : null}
        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="next" value={safeInternalPath(next, "")} />
          <label className="block text-sm font-medium">
            E-post
            <input required name="email" type="email" autoComplete="username" className="mt-1.5 h-11 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] bg-[var(--av-bg)] px-3 text-sm outline-none focus:border-[var(--av-accent)]/40" />
          </label>
          <label className="block text-sm font-medium">
            Lösenord
            <input required name="password" type="password" autoComplete="current-password" className="mt-1.5 h-11 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] bg-[var(--av-bg)] px-3 text-sm outline-none focus:border-[var(--av-accent)]/40" />
          </label>
          <button type="submit" className="h-11 w-full rounded-[var(--av-radius-md)] bg-[var(--av-accent)] text-sm font-semibold text-white hover:bg-[var(--av-accent-hover)]">
            Logga in
          </button>
        </form>
      </div>
      <p className="mt-6 text-center text-[12px] leading-relaxed text-[var(--av-text-muted)]">
        Demo: kund@demo.aqua · staff@demo.aqua · labels@demo.aqua · bottler@demo.aqua · AquaDemo26!
      </p>
    </main>
  );
}
