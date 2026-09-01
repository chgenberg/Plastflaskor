import { loginAction } from "@/actions";
import { getSessionUser, homeForRole } from "@/server/rbac";
import { safeInternalPath } from "@/domain/safePath";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Button, controlClass } from "@/ui/shell/primitives";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const user = await getSessionUser();
  const dest = safeInternalPath(next, homeForRole(user?.role ?? "PUBLIC"));
  if (user) redirect(dest);

  return (
    <main className="mx-auto flex max-w-md flex-col justify-center px-4 pb-24 pt-16">
      <div className="mb-8 text-center">
        <Image src="/brand/aqua-visibility-logo.png" alt="aqua visibility" width={140} height={46} className="mx-auto h-9 w-auto" />
        <h1 className="mt-8 text-[28px] font-semibold tracking-tight">Logga in</h1>
        <p className="mt-2 text-sm text-[var(--av-text-muted)]">Master, kund, etikett eller bottler — välj rätt konto nedan.</p>
      </div>
      <div className="av-card p-8">
        {error ? <p className="mb-4 text-sm text-[var(--av-status-blocked-fg)]">Fel e-post, lösenord eller behörighet.</p> : null}
        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="next" value={safeInternalPath(next, "")} />
          <label className="block text-sm font-medium">
            E-post
            <input required name="email" type="email" autoComplete="username" className={`${controlClass} mt-1.5`} />
          </label>
          <label className="block text-sm font-medium">
            Lösenord
            <input required name="password" type="password" autoComplete="current-password" className={`${controlClass} mt-1.5`} />
          </label>
          <Button type="submit" size="lg" className="w-full">
            Logga in
          </Button>
        </form>
      </div>
      <div className="mt-8 space-y-3 text-center text-[12px] leading-relaxed text-[var(--av-text-muted)]">
        <p className="font-medium text-[var(--av-text)]">Demovisning — samma lösenord: AquaDemo26!</p>
        <ul className="space-y-1">
          <li>Kundportal · kund@demo.aqua</li>
          <li>Admin · admin@demo.aqua eller staff@demo.aqua</li>
          <li>Etikett · labels@demo.aqua</li>
          <li>Bottler · bottler@demo.aqua</li>
        </ul>
      </div>
    </main>
  );
}
