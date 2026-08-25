"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { logoutAction } from "@/actions";

type Child = { href: string; label: string };
type Parent = { label: string; href: string; children: Child[] };

const LEFT: Parent[] = [
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
    label: "Designa",
    href: "/designa",
    children: [
      { href: "/designa", label: "Designa själv" },
      { href: "/inspiration", label: "Inspiration" },
      { href: "/valmojligheter", label: "Valmöjligheter" },
    ],
  },
];

const RIGHT: Parent[] = [
  {
    label: "Om oss",
    href: "/om",
    children: [
      { href: "/om", label: "Om Aqua Visibility" },
      { href: "/miljo", label: "Miljö" },
      { href: "/nyheter", label: "Nyheter" },
    ],
  },
  {
    label: "Kontakt",
    href: "/offert",
    children: [
      { href: "/kassa", label: "Beställ" },
      { href: "/offert", label: "Begär offert" },
      { href: "/aterforsaljare", label: "För återförsäljare" },
    ],
  },
];

const ALL = [...LEFT, ...RIGHT];

export function PublicNav({ email }: { email?: string | null }) {
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
    <header className="pointer-events-none fixed inset-x-0 top-[34px] z-50">
      <div className="relative mx-auto flex max-w-6xl items-start px-4 pt-3">
        <button
          type="button"
          aria-label="Meny"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#1d1d1f] shadow-[0_2px_12px_rgba(0,0,0,0.08)] md:hidden"
        >
          <span className="flex flex-col gap-[5px]">
            <span className="block h-[1.5px] w-4 bg-[#1d1d1f]" />
            <span className="block h-[1.5px] w-4 bg-[#1d1d1f]" />
          </span>
        </button>

        <nav className="pointer-events-auto absolute left-1/2 top-3 hidden h-[72px] -translate-x-1/2 items-center gap-1 rounded-full bg-white px-3 shadow-[0_2px_16px_rgba(0,0,0,0.08)] md:flex">
          {LEFT.map((item) => (
            <NavParent key={item.label} item={item} open={open} setOpen={setOpen} align="left" />
          ))}

          <Link href="/" className="mx-3 flex h-12 items-center justify-center md:h-14" onClick={() => setOpen(null)}>
            <Image
              src="/brand/aqua-visibility-logo.png"
              alt="aqua visibility"
              width={176}
              height={56}
              priority
              className="block h-10 w-auto -translate-y-1 object-contain md:h-11"
            />
          </Link>

          {RIGHT.map((item) => (
            <NavParent key={item.label} item={item} open={open} setOpen={setOpen} align="right" />
          ))}
        </nav>

        <div className="pointer-events-auto ml-auto flex h-12 min-w-[168px] items-center justify-center gap-2 rounded-full bg-white px-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] md:absolute md:right-4 md:top-3 md:ml-0 md:h-[72px] md:min-w-[240px] md:px-7">
          {email ? (
            <form action={logoutAction}>
              <button type="submit" className="flex h-10 items-center rounded-full px-3 text-[13px] font-medium text-[#1d1d1f] hover:bg-black/[0.05]">
                Logga ut
              </button>
            </form>
          ) : (
            <Link href="/login" aria-label="Logga in" className="flex h-10 w-10 items-center justify-center rounded-full text-[#1d1d1f] hover:bg-black/[0.05]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M5 19.2c1.6-3 4-4.5 7-4.5s5.4 1.5 7 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </Link>
          )}
          <Link href="/designa" className="hidden h-10 items-center rounded-full bg-[#1d1d1f] px-5 text-[13px] font-semibold text-white hover:text-white sm:flex">
            Starta design
          </Link>
        </div>
      </div>

      {mobileOpen ? (
        <div className="pointer-events-auto mx-4 mt-3 max-h-[70vh] overflow-auto rounded-3xl bg-white p-4 text-[#1d1d1f] shadow-[0_8px_24px_rgba(10,10,10,0.08)] md:hidden">
          <Link href="/" className="mb-4 flex items-center" onClick={() => setMobileOpen(false)}>
            <Image src="/brand/aqua-visibility-logo.png" alt="aqua visibility" width={160} height={52} className="h-12 w-auto" />
          </Link>
          <div className="flex flex-col gap-1">
            {ALL.map((item) => (
              <MobileGroup key={item.label} item={item} onNavigate={() => setMobileOpen(false)} />
            ))}
            <Link href="/designa" onClick={() => setMobileOpen(false)} className="mt-3 rounded-full bg-[#1d1d1f] px-4 py-3 text-center text-sm font-semibold text-white hover:text-white">
              Starta design
            </Link>
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
  align,
}: {
  item: Parent;
  open: string | null;
  setOpen: (v: string | null) => void;
  align: "left" | "right";
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
        className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-[13px] font-medium text-[#1d1d1f] hover:bg-black/[0.05] xl:px-4"
      >
        {item.label}
        <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden className={`transition-transform ${shown ? "rotate-180" : ""}`}>
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {shown ? (
        <div
          className={`absolute top-full z-50 min-w-[220px] pt-2 ${align === "right" ? "right-0" : "left-0"}`}
        >
          <div id={id} role="menu" className="rounded-2xl bg-white py-2 text-[#1d1d1f] shadow-[0_12px_32px_rgba(0,0,0,0.1)]">
            {item.children.map((child) => (
              <Link
                key={child.href + child.label}
                href={child.href}
                role="menuitem"
                onClick={() => setOpen(null)}
                className="block px-4 py-2.5 text-[13px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7]"
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
    <div className="border-b border-black/5 py-1">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#1d1d1f]"
      >
        {item.label}
        <span className={`text-[#766a62] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open ? (
        <div className="mb-2 ml-3 flex flex-col border-l border-black/10 pl-3">
          {item.children.map((child) => (
            <Link
              key={child.href + child.label}
              href={child.href}
              onClick={onNavigate}
              className="rounded-lg px-2 py-2 text-sm text-[#1d1d1f] hover:bg-[#f5f5f7]"
            >
              {child.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
