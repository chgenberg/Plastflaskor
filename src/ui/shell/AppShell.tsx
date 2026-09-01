"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useId, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { logoutAction } from "@/actions";
import { Button, controlCompact } from "@/ui/shell/primitives";

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: "Kund",
  AQUA_STAFF: "Drift",
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
  const showOpsSearch = title === "Operations" || title === "Drift";

  return (
    <div className="min-h-dvh bg-[var(--av-bg)] text-[var(--av-text)] md:flex">
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[var(--av-border)] bg-[var(--av-surface)] md:flex">
        <div className="px-4 pb-3 pt-5">
          <Link href="/" className="inline-block">
            <Image src="/brand/aqua-visibility-logo.png" alt="aqua visibility" width={120} height={38} className="h-7 w-auto" />
          </Link>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--av-text-muted)]">{title}</p>
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
              placeholder="Sök order, kund, produkt…"
              className={controlCompact}
            />
          </form>
        ) : null}
        <Suspense fallback={<nav className="flex-1 px-2.5" />}>
          <DashNav nav={nav} dense={dense} />
        </Suspense>
        <div className="border-t border-[var(--av-border)] px-4 py-4">
          {role ? <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--av-text-muted)]">{ROLE_LABEL[role] ?? role}</p> : null}
          <p className="mt-1 truncate text-[13px]">{email}</p>
          <form action={logoutAction} className="mt-3">
            <Button type="submit" variant="ghost" size="sm">
              Logga ut
            </Button>
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
              <Button type="submit" variant="ghost" size="sm">
                Logga ut
              </Button>
            </form>
          </div>
          <Suspense fallback={null}>
            <DashNav nav={nav} dense={dense} mobile />
          </Suspense>
          {showOpsSearch ? (
            <form action="/operations/sok" method="get" className="mt-3">
              <label className="sr-only" htmlFor="ops-search-mobile">
                Sök ordrar
              </label>
              <input
                id="ops-search-mobile"
                name="q"
                type="search"
                placeholder="Sök order, kund, produkt…"
                className={controlCompact}
              />
            </form>
          ) : null}
        </header>
        <main className={`mx-auto w-full max-w-7xl flex-1 ${dense ? "px-3 py-4 md:px-5" : "px-4 py-5 md:px-6"}`}>{children}</main>
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
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(nav.map((m) => [m.id, m.children.some((c) => childActive(c.href, path, search))])),
  );

  useEffect(() => {
    setOpen((prev) => {
      const next = { ...prev };
      for (const mother of nav) {
        if (mother.children.some((c) => childActive(c.href, path, search))) next[mother.id] = true;
      }
      return next;
    });
  }, [nav, path, search]);

  const motherTap = dense ? "min-h-12 px-3 py-3 text-[15px]" : "min-h-8 px-2.5 py-1.5 text-[13px]";
  const childTap = dense ? "min-h-12 px-3 py-3 text-[14px]" : "h-8 px-2.5 text-[13px]";

  return (
    <nav className={mobile ? "mt-3 flex flex-col gap-0.5" : "flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 pb-3"}>
      {nav.map((mother) => (
        <Mother
          key={mother.id}
          mother={mother}
          open={Boolean(open[mother.id])}
          onToggle={() => setOpen((prev) => ({ ...prev, [mother.id]: !prev[mother.id] }))}
          path={path}
          search={search}
          motherTap={motherTap}
          childTap={childTap}
        />
      ))}
    </nav>
  );
}

function Mother({
  mother,
  open,
  onToggle,
  path,
  search,
  motherTap,
  childTap,
}: {
  mother: DashNavMother;
  open: boolean;
  onToggle: () => void;
  path: string;
  search: URLSearchParams;
  motherTap: string;
  childTap: string;
}) {
  const panelId = useId();
  const childIsActive = mother.children.some((c) => childActive(c.href, path, search));

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className={`flex w-full items-center justify-between rounded-[var(--av-radius-md)] ${motherTap} font-semibold ${
          childIsActive ? "text-[var(--av-text)]" : "text-[var(--av-text-secondary)] hover:bg-[var(--av-bg)] hover:text-[var(--av-text)]"
        }`}
      >
        <span>{mother.label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          aria-hidden="true"
          className={`shrink-0 opacity-50 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <div id={panelId} className="mb-1 ml-2 flex flex-col gap-0.5 border-l border-[var(--av-border)] pl-2">
          {mother.children.map((child) => {
            const on = childActive(child.href, path, search);
            return (
              <Link
                key={child.href}
                href={child.href}
                className={`flex items-center justify-between rounded-[var(--av-radius-md)] ${childTap} font-medium ${
                  on
                    ? "bg-[var(--av-accent-soft)] text-[var(--av-accent)]"
                    : "text-[var(--av-text-secondary)] hover:bg-[var(--av-bg)] hover:text-[var(--av-text)]"
                }`}
              >
                <span>{child.label}</span>
                {child.badge ? (
                  <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-md bg-[var(--av-accent)] px-1.5 text-[11px] font-semibold text-white">
                    {child.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
