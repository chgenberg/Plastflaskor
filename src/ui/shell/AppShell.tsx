import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/actions";

export function AppShell({
  title,
  nav,
  children,
  email,
}: {
  title: string;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
  email?: string | null;
}) {
  return (
    <div className="min-h-screen bg-[var(--av-bg)]">
      <header className="sticky top-0 z-30 border-b border-[var(--av-border)] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link href="/">
            <Image src="/brand/aqua-visibility-logo.png" alt="aqua visibility" width={120} height={40} />
          </Link>
          <span className="hidden h-6 w-px bg-[var(--av-border)] sm:block" />
          <p className="text-sm font-medium">{title}</p>
          <nav className="ml-auto hidden items-center gap-4 text-sm text-[var(--av-text-secondary)] md:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-[var(--av-text)]">
                {n.label}
              </Link>
            ))}
          </nav>
          <span className="text-xs text-[var(--av-text-muted)]">{email}</span>
          <form action={logoutAction}>
            <button className="text-sm text-[var(--av-text-secondary)]">Logga ut</button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
