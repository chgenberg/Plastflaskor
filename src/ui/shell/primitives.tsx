import Link from "next/link";
import type { ReactNode } from "react";
import { statusTone } from "@/domain/enums";

export function StatusChip({
  status,
  label,
  requestedDate,
}: {
  status: string;
  label?: string;
  requestedDate?: string | null;
}) {
  const tone = statusTone(status, requestedDate);
  const cls =
    tone === "done"
      ? "bg-[var(--av-status-done-bg)] text-[var(--av-status-done-fg)]"
      : tone === "next"
        ? "bg-[var(--av-status-next-bg)] text-[var(--av-status-next-fg)]"
        : tone === "blocked"
          ? "bg-[var(--av-status-blocked-bg)] text-[var(--av-status-blocked-fg)]"
          : "bg-[var(--av-status-idle-bg)] text-[var(--av-status-idle-fg)]";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label ?? status}
    </span>
  );
}

export function KpiCard({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const inner = (
    <div className="rounded-[22px] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.04)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">{label}</p>
      <p className="mt-2 text-[28px] font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

const ACTION_TONE = {
  green: "bg-[var(--av-status-done-bg)] text-[var(--av-status-done-fg)]",
  yellow: "bg-[var(--av-status-next-bg)] text-[var(--av-status-next-fg)]",
  red: "bg-[var(--av-status-blocked-bg)] text-[var(--av-status-blocked-fg)]",
  grey: "bg-[var(--av-status-idle-bg)] text-[var(--av-status-idle-fg)]",
} as const;

export function ActionCard({
  href,
  label,
  value,
  tone,
}: {
  href: string;
  label: string;
  value: number | string;
  tone: keyof typeof ACTION_TONE;
}) {
  return (
    <Link href={href} className={`block rounded-[22px] p-5 shadow-[0_8px_30px_rgba(15,23,42,.04)] transition hover:brightness-[0.98] ${ACTION_TONE[tone]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80">{label}</p>
      <p className="mt-2 text-[28px] font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-3 text-[13px] font-medium">Öppna →</p>
    </Link>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-black/10 bg-white px-8 py-14 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[#6b7280]">{body}</p>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-[14px] text-[#6b7280]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, children, padded = true }: { title?: ReactNode; children: ReactNode; padded?: boolean }) {
  return (
    <section className="overflow-hidden rounded-[22px] bg-white shadow-[0_8px_30px_rgba(15,23,42,.04)]">
      {title ? (
        <p className="border-b border-black/5 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">{title}</p>
      ) : null}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function ActionRow({ href, label, value }: { href: string; label: string; value: string | number }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-4 rounded-2xl px-1 py-3 hover:bg-black/[0.03]">
      <span className="text-[14px]">{label}</span>
      <span className="tabular-nums text-[14px] font-medium text-[#3B5BAA]">{value}</span>
    </Link>
  );
}

export function DataTable({
  headers,
  children,
}: {
  headers: { label: string; align?: "right" | "left" }[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
            {headers.map((h) => (
              <th key={h.label} className={`px-5 py-3 ${h.align === "right" ? "text-right" : ""}`}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function DataRow({ href, children, last }: { href?: string; children: ReactNode; last?: boolean }) {
  return (
    <tr className={`${last ? "" : "border-b border-black/5"} ${href ? "group hover:bg-black/[0.03]" : ""}`}>
      {children}
    </tr>
  );
}

export function FileLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="font-medium text-[#3B5BAA] hover:underline">
      {children}
    </a>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  className?: string;
}) {
  const cls =
    variant === "primary" ? "bg-[#5B7FD4] text-white hover:bg-[#4C6FC4]" : "border border-black/10 bg-white text-[#1d1d1f]";
  const h = size === "lg" ? "h-12 text-[15px]" : "h-11 text-sm";
  return (
    <Link href={href} className={`inline-flex items-center justify-center rounded-full px-5 font-semibold ${h} ${cls} ${className}`}>
      {children}
    </Link>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost"; size?: "md" | "lg" }) {
  const cls =
    variant === "primary"
      ? "bg-[#5B7FD4] text-white hover:bg-[#4C6FC4]"
      : variant === "secondary"
        ? "border border-black/10 bg-white text-[#1d1d1f]"
        : "text-[#6b7280]";
  const h = size === "lg" ? "h-12 text-[15px]" : "h-11 text-sm";
  return (
    <button className={`inline-flex items-center justify-center rounded-full px-5 font-semibold disabled:opacity-40 ${h} ${cls} ${className}`} {...props}>
      {children}
    </button>
  );
}
