"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { logoutAction } from "@/actions";
import {
  NAV_BY_ROLE,
  ROLE_LABEL,
  SETTINGS_HREF,
  childActive,
  flatNav,
  initials,
  navRoleOf,
  titleForPath,
  type DashNavMother,
} from "./nav";

export type { DashNavChild, DashNavMother } from "./nav";

export function AppShell({
  title,
  children,
  email,
  role,
  name,
  dense,
}: {
  title: string;
  children: React.ReactNode;
  email?: string | null;
  role?: string | null;
  name?: string | null;
  dense?: boolean;
}) {
  const path = usePathname();
  return (
    <Suspense
      fallback={
        <ShellFrame title={title} email={email} role={role} name={name} dense={dense} path={path}>
          {children}
        </ShellFrame>
      }
    >
      <ShellSearch title={title} email={email} role={role} name={name} dense={dense} path={path}>
        {children}
      </ShellSearch>
    </Suspense>
  );
}

function ShellSearch({
  title,
  children,
  email,
  role,
  name,
  dense,
  path,
}: {
  title: string;
  children: React.ReactNode;
  email?: string | null;
  role?: string | null;
  name?: string | null;
  dense?: boolean;
  path: string;
}) {
  const search = useSearchParams();
  return (
    <ShellFrame title={title} email={email} role={role} name={name} dense={dense} path={path} search={search}>
      {children}
    </ShellFrame>
  );
}

function ShellFrame({
  title,
  children,
  email,
  role,
  name,
  dense,
  path,
  search,
}: {
  title: string;
  children: React.ReactNode;
  email?: string | null;
  role?: string | null;
  name?: string | null;
  dense?: boolean;
  path: string;
  search?: URLSearchParams | { get(name: string): string | null };
}) {
  const navRole = navRoleOf(role);
  const nav = NAV_BY_ROLE[navRole];
  const tabs = flatNav(navRole);
  const showMer = tabs.length > 4;
  const tabItems = showMer ? tabs.slice(0, 4) : tabs;
  const showSearch = navRole === "AQUA";
  const settingsHref = SETTINGS_HREF[navRole];
  const [open, setOpen] = useState(false);
  const params = search ?? new URLSearchParams();
  const pageTitle = titleForPath(path, params);
  const letters = initials(name ?? email);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);

  const foot = (
    <div className="av-shell-foot">
      {settingsHref ? (
        <Link href={settingsHref} className="av-shell-logout mb-2 inline-block">
          Inställningar
        </Link>
      ) : null}
      <form action={logoutAction}>
        <button type="submit" className="av-shell-logout">
          Logga ut
        </button>
      </form>
      <div className="av-user-block">
        <span className="av-avatar" aria-hidden>
          {letters}
        </span>
        <div className="min-w-0">
          {role ? <p className="av-shell-role">{ROLE_LABEL[role] ?? role}</p> : null}
          {name ? <p className="truncate text-[13px] font-medium">{name}</p> : null}
          {email ? <p className="av-shell-email">{email}</p> : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[var(--av-bg)] text-[var(--av-text)]">
      <aside className="av-shell-aside hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex">
        <div className="av-shell-brand">
          <Link href="/" className="inline-block">
            <Image src="/brand/aqua-visibility-logo.png" alt="aqua visibility" width={120} height={38} className="h-6 w-auto" />
          </Link>
          <p className="av-shell-title">{title}</p>
        </div>
        {showSearch ? <SearchForm id="ops-search-desktop" /> : null}
        <DashNav nav={nav} dense={dense} path={path} search={params} />
        {foot}
      </aside>

      <header className="av-topbar md:hidden">
        <p className="av-topbar-title truncate">{pageTitle}</p>
        <button
          type="button"
          className="av-avatar"
          aria-label="Öppna meny"
          aria-expanded={open}
          aria-controls="av-drawer"
          onClick={() => setOpen(true)}
        >
          {letters}
        </button>
      </header>

      <nav className="av-tabbar md:hidden" aria-label="Snabbmeny">
        {tabItems.map((item) => {
          const on = childActive(item.href, path, params);
          return (
            <Link key={item.href} href={item.href} aria-current={on ? "page" : undefined} className={`av-tab${on ? " is-active" : ""}`}>
              {item.label}
            </Link>
          );
        })}
        {showMer ? (
          <button type="button" className="av-tab" aria-expanded={open} aria-controls="av-drawer" onClick={() => setOpen(true)}>
            Mer
          </button>
        ) : null}
      </nav>

      {open ? <button type="button" className="av-drawer-overlay md:hidden" aria-label="Stäng meny" onClick={() => setOpen(false)} /> : null}
      <div id="av-drawer" className="av-drawer-panel md:hidden" inert={!open || undefined}>
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-medium">Meny</p>
          <button type="button" className="av-drawer-close av-shell-logout" onClick={() => setOpen(false)}>
            Stäng
          </button>
        </div>
        {showSearch ? <SearchForm id="ops-search-drawer" /> : null}
        <DashNav nav={nav} dense={dense} path={path} search={params} />
        {foot}
      </div>

      <div className="flex min-w-0 flex-1 flex-col pt-[var(--av-topbar-h)] pb-[var(--av-tabbar-h)] md:pl-[var(--av-shell-w)] md:pt-0 md:pb-0">
        <main className={`mx-auto w-full max-w-7xl flex-1 ${dense ? "px-3 py-5 md:px-6 md:py-7" : "px-4 py-6 md:px-8 md:py-8"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

function SearchForm({ id }: { id: string }) {
  return (
    <form action="/operations/sok" method="get" className="av-shell-search">
      <label className="sr-only" htmlFor={id}>
        Sök ordrar
      </label>
      <input id={id} name="q" type="search" placeholder="Sök…" className="av-shell-search-input" />
    </form>
  );
}

function DashNav({
  nav,
  dense,
  path,
  search,
}: {
  nav: DashNavMother[];
  dense?: boolean;
  path: string;
  search: URLSearchParams | { get(name: string): string | null };
}) {
  return (
    <nav className="av-nav" aria-label="Huvudmeny">
      {nav.map((mother) => {
        const bare = mother.children.length === 1;
        return (
          <section key={mother.id} className={bare ? "av-nav-group av-nav-group--bare" : "av-nav-group"}>
            {bare ? null : <h2 className="av-nav-label">{mother.label}</h2>}
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
        );
      })}
    </nav>
  );
}
