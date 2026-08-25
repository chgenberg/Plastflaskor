import Link from "next/link";
import { statusTone } from "@/domain/enums";

export function StatusChip({ status, label }: { status: string; label?: string }) {
  const tone = statusTone(status);
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
    <div className="rounded-2xl bg-white p-5 shadow-[var(--av-shadow-sm)]">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--av-text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--av-border)] bg-white p-10 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--av-text-secondary)]">{body}</p>
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const cls =
    variant === "primary"
      ? "bg-[var(--av-accent)] text-white hover:bg-[var(--av-accent-hover)]"
      : variant === "secondary"
        ? "border border-[var(--av-border)] bg-white text-[var(--av-text)]"
        : "text-[var(--av-text-secondary)]";
  return (
    <button
      className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium disabled:opacity-40 ${cls}`}
      {...props}
    >
      {children}
    </button>
  );
}
