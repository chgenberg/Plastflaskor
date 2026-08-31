"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions";

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: "Kund",
  RESELLER: "Återförsäljare",
  AQUA_STAFF: "Drift",
  AQUA_ADMIN: "Admin",
  FACTORY: "Leverantör",
};

export function AppShell({
  title,
  nav,
  children,
  email,
  role,
  dense,
}: {
  title: string;
  nav: { href: string; label: string; badge?: number }[];
  children: React.ReactNode;
  email?: string | null;
  role?: string | null;
  dense?: boolean;
}) {
  const path = usePathname();
  const tap = dense ? "min-h-12 px-3 py-3 text-[15px]" : "px-3 py-2 text-[13px]";
  const showOpsSearch = title === "Operations" || title === "Drift" || path.startsWith("/operations");

  function active(href: string) {
    if (href === "/partner" || href === "/operations" || href === "/factory" || href === "/konto") return path === href;
    return path === href || path.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-dvh bg-[var(--av-bg)] text-[var(--av-text)] md:flex">
      <aside className="hidden w-[232px] shrink-0 flex-col border-r border-[var(--av-border)] bg-[var(--av-surface)] md:flex">
        <div className="px-5 pb-4 pt-6">
          <Link href="/" className="inline-block">
            <Image src="/brand/aqua-visibility-logo.png" alt="aqua visibility" width={120} height={38} className="h-8 w-auto" />
          </Link>
          <p className="mt-5 text-[12px] font-medium text-[var(--av-text-muted)]">{title}</p>
        </div>
        {showOpsSearch ? (
          <form action="/operations/sok" method="get" className="px-3 pb-3">
            <label className="sr-only" htmlFor="ops-search-desktop">
              Sök ordrar
            </label>
            <input
              id="ops-search-desktop"
              name="q"
              type="search"
              placeholder="Sök order, kund, ÅF…"
              className="h-9 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border)] bg-[var(--av-bg)] px-3 text-[13px] outline-none placeholder:text-[var(--av-text-muted)] focus:border-[var(--av-accent)]/40"
            />
          </form>
        ) : null}
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center justify-between rounded-[var(--av-radius-md)] ${tap} font-medium ${
                active(n.href)
                  ? "bg-[var(--av-accent-soft)] text-[var(--av-accent)]"
                  : "text-[var(--av-text-secondary)] hover:bg-[var(--av-bg)] hover:text-[var(--av-text)]"
              }`}
            >
              <span>{n.label}</span>
              {n.badge ? (
                <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-md bg-[var(--av-accent)] px-1.5 text-[11px] font-semibold text-white">
                  {n.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[var(--av-border)] px-5 py-4">
          {role ? <p className="text-[11px] font-medium text-[var(--av-text-muted)]">{ROLE_LABEL[role] ?? role}</p> : null}
          <p className="mt-1 truncate text-[13px] text-[var(--av-text)]">{email}</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="text-[13px] text-[var(--av-text-muted)] hover:text-[var(--av-text)]">
              Logga ut
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[var(--av-border)] bg-[var(--av-surface)]/90 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Image src="/brand/aqua-visibility-logo.png" alt="aqua visibility" width={100} height={32} className="h-7 w-auto" />
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="text-[13px] text-[var(--av-text-muted)]">
                Logga ut
              </button>
            </form>
          </div>
          <nav className="-mx-1 mt-3 flex gap-1 overflow-x-auto pb-1">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`shrink-0 rounded-full ${dense ? "px-4 py-2.5 text-[14px]" : "px-3 py-1.5 text-[12px]"} font-medium ${
                  active(n.href) ? "bg-[var(--av-accent-soft)] text-[var(--av-accent)]" : "text-[var(--av-text-muted)]"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          {showOpsSearch ? (
            <form action="/operations/sok" method="get" className="mt-3">
              <label className="sr-only" htmlFor="ops-search-mobile">
                Sök ordrar
              </label>
              <input
                id="ops-search-mobile"
                name="q"
                type="search"
                placeholder="Sök order, kund, ÅF…"
                className="h-10 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border)] bg-[var(--av-bg)] px-3 text-[13px] outline-none"
              />
            </form>
          ) : null}
        </header>
        <main className={`mx-auto w-full max-w-6xl flex-1 ${dense ? "px-3 py-5 md:px-6" : "px-4 py-8 md:px-8"}`}>{children}</main>
      </div>
    </div>
  );
}
