"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { logoutAction } from "@/actions";

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: "Kund",
  AQUA_STAFF: "Admin",
  AQUA_ADMIN: "Admin",
  LABEL: "Etikett",
  BOTTLER: "Bottler",
  FACTORY: "Bottler",
};

export type DashNavChild = { href: string; label: string; badge?: number };
export type DashNavMother = { id: string; label: string; children: DashNavChild[] };

export function AppShell({
  title,
  nav,
  children,
  email,
  role,
  dense,
}: {
  title: string;
  nav: DashNavMother[];
  children: React.ReactNode;
  email?: string | null;
  role?: string | null;
  dense?: boolean;
}) {
  const showSearch = title === "Master Dashboard" || title === "Operations" || title === "Admin" || title === "Drift";

  return (
    <div className="min-h-dvh bg-[var(--av-bg)] text-[var(--av-text)] md:flex">
      <aside className="av-shell-aside hidden md:flex">
        <div className="av-shell-brand">
          <Link href="/" className="inline-block">
            <Image src="/brand/aqua-visibility-logo.png" alt="aqua visibility" width={120} height={38} className="h-6 w-auto" />
          </Link>
          <p className="av-shell-title">{title}</p>
        </div>
        {showSearch ? (
          <form action="/operations/sok" method="get" className="av-shell-search">
            <label className="sr-only" htmlFor="ops-search-desktop">
              Sök ordrar
            </label>
            <input
              id="ops-search-desktop"
              name="q"
              type="search"
              placeholder="Sök…"
              className="av-shell-search-input"
            />
          </form>
        ) : null}
        <Suspense fallback={<nav className="av-nav" />}>
          <DashNav nav={nav} dense={dense} />
        </Suspense>
        <div className="av-shell-foot">
          {role ? <p className="av-shell-role">{ROLE_LABEL[role] ?? role}</p> : null}
          {email ? <p className="av-shell-email">{email}</p> : null}
          <form action={logoutAction}>
            <button type="submit" className="av-shell-logout">
              Logga ut
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="av-shell-mobile md:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/">
              <Image src="/brand/aqua-visibility-logo.png" alt="aqua visibility" width={100} height={32} className="h-6 w-auto" />
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="av-shell-logout">
                Logga ut
              </button>
            </form>
          </div>
          <Suspense fallback={null}>
            <DashNav nav={nav} dense={dense} mobile />
          </Suspense>
          {showSearch ? (
            <form action="/operations/sok" method="get" className="av-shell-search av-shell-search--mobile">
              <label className="sr-only" htmlFor="ops-search-mobile">
                Sök ordrar
              </label>
              <input
                id="ops-search-mobile"
                name="q"
                type="search"
                placeholder="Sök…"
                className="av-shell-search-input"
              />
            </form>
          ) : null}
        </header>
        <main className={`mx-auto w-full max-w-7xl flex-1 ${dense ? "px-3 py-5 md:px-6 md:py-7" : "px-4 py-6 md:px-8 md:py-8"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

function hrefParts(href: string) {
  const [path, query] = href.split("?");
  return { path, query: new URLSearchParams(query ?? "") };
}

function childActive(href: string, path: string, search: URLSearchParams) {
  const { path: target, query } = hrefParts(href);
  const roots = ["/operations", "/konto", "/labels", "/bottler"];
  if (query.get("phase")) {
    return path === target || path.startsWith(`${target}/`) ? search.get("phase") === query.get("phase") : false;
  }
  if (target === "/operations/ordrar" && search.get("phase") === "labels") return false;
  if (target === "/konto/ordrar" && (path === "/konto/ordrar/ny" || path.startsWith("/konto/ordrar/ny/"))) return false;
  if (roots.includes(target)) return path === target;
  return path === target || path.startsWith(`${target}/`);
}

function DashNav({ nav, dense, mobile }: { nav: DashNavMother[]; dense?: boolean; mobile?: boolean }) {
  const path = usePathname();
  const search = useSearchParams();

  return (
    <nav className={mobile ? "av-nav av-nav--mobile" : "av-nav"} aria-label="Huvudmeny">
      {nav.map((mother) => (
        <section key={mother.id} className="av-nav-group">
          <h2 className="av-nav-label">{mother.label}</h2>
          <ul className="av-nav-list">
            {mother.children.map((child) => {
              const on = childActive(child.href, path, search);
              return (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    aria-current={on ? "page" : undefined}
                    className={`av-nav-link${dense ? " av-nav-link--dense" : ""}${on ? " is-active" : ""}`}
                  >
                    <span>{child.label}</span>
                    {child.badge ? <span className="av-nav-badge">{child.badge}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
