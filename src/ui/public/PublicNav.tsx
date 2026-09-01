"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { logoutAction } from "@/actions";
import { Button, LinkButton } from "@/ui/shell/primitives";

type Child = { href: string; label: string };
type Parent = { label: string; href: string; children: Child[] };

const ITEMS: Parent[] = [
  {
    label: "Produkter",
    href: "/produkter",
    children: [
      { href: "/produkter", label: "Alla produkter" },
      { href: "/produkter/profilvatten", label: "Profilvatten" },
      { href: "/produkter/pappersmuggar", label: "Pappersmuggar" },
      { href: "/produkter/energidryck", label: "Energidryck" },
      { href: "/produkter/sportflaskor", label: "Sportflaskor" },
      { href: "/produkter/lask-must", label: "Läsk" },
      { href: "/produkter/kyl", label: "Kyl" },
      { href: "/ovriga", label: "Övriga" },
    ],
  },
  {
    label: "Inspiration",
    href: "/inspiration",
    children: [
      { href: "/inspiration", label: "Inspiration" },
      { href: "/valmojligheter", label: "Valmöjligheter" },
      { href: "/login", label: "Design studio (inloggad)" },
    ],
  },
  {
    label: "Om oss",
    href: "/om",
    children: [
      { href: "/om", label: "Om Aqua Visibility" },
      { href: "/miljo", label: "Miljö" },
      { href: "/nyheter", label: "Nyheter" },
      { href: "/inspiration", label: "Referenser" },
    ],
  },
  {
    label: "Kontakt",
    href: "/offert",
    children: [
      { href: "/offert", label: "Begär offert" },
      { href: "/login", label: "Kundportal" },
    ],
  },
];

const PARENT_HREFS = new Set(ITEMS.map((item) => item.href));

function pathActive(path: string, href: string, children: Child[]) {
  if (path === href || path.startsWith(`${href}/`)) return true;
  return children.some(
    (child) =>
      child.href !== "/login" &&
      !PARENT_HREFS.has(child.href) &&
      (path === child.href || path.startsWith(`${child.href}/`)),
  );
}

export function PublicNav({ email }: { email?: string | null }) {
  const path = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(null);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--av-border)] bg-[var(--av-surface)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="shrink-0" onClick={() => setOpen(null)}>
          <Image
            src="/brand/aqua-visibility-logo.png"
            alt="aqua visibility"
            width={148}
            height={40}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden flex-1 items-center gap-0.5 md:flex">
          {ITEMS.map((item) => (
            <NavParent key={item.label} item={item} open={open} setOpen={setOpen} active={pathActive(path, item.href, item.children)} />
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {email ? (
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Logga ut
              </Button>
            </form>
          ) : (
            <LinkButton href="/login" variant="ghost" size="sm">
              Logga in
            </LinkButton>
          )}
          <LinkButton href="/login">
            Kundportal
          </LinkButton>
        </div>

        <button
          type="button"
          aria-label="Meny"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-[var(--av-radius-md)] text-[var(--av-text)] md:hidden"
        >
          <span className="flex flex-col gap-[5px]">
            <span className="block h-[1.5px] w-4 bg-[var(--av-text)]" />
            <span className="block h-[1.5px] w-4 bg-[var(--av-text)]" />
          </span>
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[var(--av-border)] bg-[var(--av-surface)] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {ITEMS.map((item) => (
              <MobileGroup key={item.label} item={item} onNavigate={() => setMobileOpen(false)} />
            ))}
            <LinkButton href="/login" variant="ghost" className="mt-3 w-full" onClick={() => setMobileOpen(false)}>
              Logga in
            </LinkButton>
            <LinkButton href="/login" size="lg" className="w-full" onClick={() => setMobileOpen(false)}>
              Kundportal
            </LinkButton>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function NavParent({
  item,
  open,
  setOpen,
  active,
}: {
  item: Parent;
  open: string | null;
  setOpen: (v: string | null) => void;
  active?: boolean;
}) {
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const shown = open === item.label;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(null);
    }
    if (shown) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [shown, setOpen]);

  return (
    <div
      ref={wrap}
      className="relative"
      onMouseEnter={() => setOpen(item.label)}
      onMouseLeave={() => setOpen(null)}
    >
      <button
        type="button"
        aria-expanded={shown}
        aria-controls={id}
        onClick={() => setOpen(shown ? null : item.label)}
        className={`inline-flex h-9 items-center gap-1 rounded-[var(--av-radius-md)] px-3 text-[13px] font-medium transition-colors hover:bg-[var(--av-bg)] hover:text-[var(--av-text)] ${active ? "bg-[var(--av-bg)] text-[var(--av-text)]" : "text-[var(--av-text-secondary)]"}`}
      >
        {item.label}
        <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden className={`opacity-50 transition-transform ${shown ? "rotate-180" : ""}`}>
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {shown ? (
        <div className="absolute left-0 top-full z-50 min-w-[220px] pt-2">
          <div id={id} role="menu" className="av-card py-1.5">
            {item.children.map((child) => (
              <Link
                key={child.href + child.label}
                href={child.href}
                role="menuitem"
                onClick={() => setOpen(null)}
                className="block px-3.5 py-2 text-[13px] text-[var(--av-text-secondary)] hover:bg-[var(--av-bg)] hover:text-[var(--av-text)]"
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileGroup({ item, onNavigate }: { item: Parent; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--av-border)] py-1">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-[var(--av-radius-md)] px-3 py-2.5 text-left text-sm font-medium"
      >
        {item.label}
        <span className={`text-[var(--av-text-muted)] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open ? (
        <div className="mb-2 ml-3 flex flex-col border-l border-[var(--av-border)] pl-3">
          {item.children.map((child) => (
            <Link
              key={child.href + child.label}
              href={child.href}
              onClick={onNavigate}
              className="rounded-[var(--av-radius-md)] px-2 py-2 text-sm text-[var(--av-text-secondary)]"
            >
              {child.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
