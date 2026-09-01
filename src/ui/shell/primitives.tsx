import Link from "next/link";
import type { ReactNode } from "react";
import { eventLabel, statusTone } from "@/domain/enums";

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
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {label ?? eventLabel(status)}
    </span>
  );
}

export function DashPage({ children }: { children: ReactNode }) {
  return <div className="av-dash-page">{children}</div>;
}

export function KpiStrip({ children, cols }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  return (
    <div className="av-kpi-strip" style={cols ? { ["--av-kpi-cols" as string]: String(cols) } : undefined}>
      {children}
    </div>
  );
}

export function KpiCard({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const inner = (
    <>
      <p className="av-label">{label}</p>
      <p className="av-kpi-value">{value}</p>
    </>
  );
  return href ? (
    <Link href={href} className="av-kpi-item">
      {inner}
    </Link>
  ) : (
    <div className="av-kpi-item">{inner}</div>
  );
}

export function ActionList({ children }: { children: ReactNode }) {
  return <div className="av-action-list">{children}</div>;
}

export function ActionCard({
  href,
  label,
  value,
  tone,
  detail,
}: {
  href: string;
  label: string;
  value: number | string;
  tone: "green" | "yellow" | "red" | "grey";
  detail?: string;
}) {
  return (
    <Link href={href} className={`av-action-row is-${tone}`}>
      <span className="av-action-copy">
        <strong>{label}</strong>
        {detail ? <span>{detail}</span> : null}
      </span>
      <span className="av-action-value">{value}</span>
    </Link>
  );
}

export function NextStep({
  title,
  body,
  href,
  cta,
  tone = "next",
}: {
  title: string;
  body: string;
  href?: string;
  cta?: string;
  tone?: "next" | "done" | "blocked";
}) {
  return (
    <section className={`av-next is-${tone}`}>
      <p className="av-label">Vad behöver du göra nu?</p>
      <h2>{title}</h2>
      <p>{body}</p>
      {href && cta ? (
        <div className="av-next-cta">
          <LinkButton href={href} size="sm">
            {cta}
          </LinkButton>
        </div>
      ) : null}
    </section>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="av-empty">
      <h3>{title}</h3>
      <p>{body}</p>
      {action ? <div className="av-empty-action">{action}</div> : null}
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
    <div className="av-page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, children, padded = true }: { title?: ReactNode; children: ReactNode; padded?: boolean }) {
  return (
    <section className="av-card overflow-hidden">
      {title ? <p className="av-section-title border-b border-[var(--av-border)] px-4 py-2.5">{title}</p> : null}
      <div className={padded ? "p-4" : ""}>{children}</div>
    </section>
  );
}

export function ActionRow({ href, label, value }: { href: string; label: string; value: string | number }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-4 rounded-[var(--av-radius-md)] px-1 py-3 hover:bg-[var(--av-bg)]">
      <span className="text-[14px]">{label}</span>
      <span className="tabular-nums text-[14px] font-medium text-[var(--av-accent)]">{value}</span>
    </Link>
  );
}

export function DashList({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-1.5">{children}</div>;
}

function isFileHref(href: string) {
  return href.startsWith("/api/") || href.startsWith("http://") || href.startsWith("https://");
}

function TextLink({ href, children }: { href: string; children: ReactNode }) {
  const cls = "text-[14px] font-semibold tracking-tight text-[var(--av-text)] hover:text-[var(--av-accent)]";
  return isFileHref(href) ? (
    <a href={href} className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function DashRow({
  primary,
  primaryHref,
  columns = [],
  status,
  actions,
}: {
  primary: ReactNode;
  primaryHref?: string;
  columns?: ReactNode[];
  status?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="av-row flex-wrap sm:flex-nowrap">
      <div className="min-w-[7rem] shrink-0">
        {primaryHref ? (
          <TextLink href={primaryHref}>{primary}</TextLink>
        ) : (
          <p className="text-[14px] font-semibold tracking-tight text-[var(--av-text)]">{primary}</p>
        )}
      </div>
      {columns.map((col, i) => (
        <p key={i} className="min-w-0 flex-1 truncate text-[13px] text-[var(--av-text-secondary)]">
          {col}
        </p>
      ))}
      <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
        {status}
        {actions}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="av-label">{label}</p>
      <div className="mt-1 text-[14px] font-medium text-[var(--av-text)]">{children}</div>
    </div>
  );
}

export function Timeline({
  steps,
}: {
  steps: { id: string; label: string; done?: boolean; current?: boolean }[];
}) {
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => (
        <li key={s.id} className="flex items-start gap-3">
          <span className="flex w-4 flex-col items-center">
            <span
              className={`mt-1.5 h-2.5 w-2.5 rounded-full ${
                s.current
                  ? "bg-[var(--av-accent)] ring-4 ring-[var(--av-accent-soft)]"
                  : s.done
                    ? "bg-[var(--av-green-500)]"
                    : "bg-[var(--av-gray-200)]"
              }`}
            />
            {i < steps.length - 1 ? <span className="h-6 w-px bg-[var(--av-border-strong)]" /> : null}
          </span>
          <span
            className={`pb-4 text-[14px] ${
              s.current ? "font-semibold text-[var(--av-accent)]" : s.done ? "font-medium text-[var(--av-text)]" : "text-[var(--av-text-muted)]"
            }`}
          >
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function DataTable({
  headers,
  children,
  flush,
}: {
  headers: { label: string; align?: "right" | "left" }[];
  children: ReactNode;
  flush?: boolean;
}) {
  return (
    <div className={flush === false ? "av-table-wrap" : "av-table-wrap av-table-wrap--flush"}>
      <table className="av-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h.label} className={h.align === "right" ? "av-num" : undefined}>
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

export function DataRow({ href, children }: { href?: string; children: ReactNode; last?: boolean }) {
  return <tr className={href ? "group" : undefined}>{children}</tr>;
}

export function DashTable({
  columns,
  children,
  count,
}: {
  columns: { label: string; align?: "right"; sr?: boolean }[];
  children: ReactNode;
  count?: string;
}) {
  return (
    <div>
      {count ? <p className="mb-2 text-[12px] tabular-nums text-[var(--av-text-muted)]">{count}</p> : null}
      <div className="av-table-wrap">
        <table className="av-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.label} className={c.align === "right" ? "av-num" : c.sr ? "av-actions" : undefined}>
                  {c.sr ? <span className="sr-only">{c.label}</span> : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function TableActions({ children }: { children: ReactNode }) {
  return <div className="inline-flex flex-wrap items-center justify-end gap-1.5">{children}</div>;
}

export const controlClass =
  "h-11 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] bg-[var(--av-surface)] px-3 text-[14px] outline-none focus:border-[var(--av-accent)]/40";

export const controlCompact =
  "h-9 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] bg-[var(--av-surface)] px-2.5 text-[13px] outline-none focus:border-[var(--av-accent)]/40";

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="av-section-title">{children}</h2>;
}

export function FileLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="font-medium text-[var(--av-accent)] hover:underline">
      {children}
    </a>
  );
}

const btnBase = "inline-flex items-center justify-center font-semibold transition disabled:opacity-40";
const btnH = {
  sm: "h-8 px-3.5 text-[13px] font-medium",
  md: "h-10 px-4 text-[13px]",
  lg: "min-h-12 h-12 px-5 text-[15px]",
} as const;
const btnVariant = {
  primary: "rounded-[var(--av-radius-md)] bg-[var(--av-accent)] text-white hover:bg-[var(--av-accent-hover)]",
  secondary: "rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] bg-[var(--av-surface)] text-[var(--av-text)] hover:bg-[var(--av-bg)]",
  ghost: "rounded-[var(--av-radius-md)] text-[var(--av-text-muted)] hover:text-[var(--av-text)]",
} as const;

type BtnVariant = keyof typeof btnVariant;
type BtnSize = keyof typeof btnH;

function btnClass(variant: BtnVariant, size: BtnSize, className: string) {
  return `${btnBase} ${btnH[size]} ${btnVariant[variant]} ${className}`;
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: BtnSize;
  className?: string;
  onClick?: () => void;
}) {
  const cls = btnClass(variant, size, className);
  if (isFileHref(href)) {
    return (
      <a href={href} className={cls} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} onClick={onClick}>
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
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }) {
  return (
    <button className={btnClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function FilterChip({
  href,
  active,
  children,
  solid,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
  solid?: boolean;
}) {
  const radius = solid ? "rounded-full" : "rounded-[var(--av-radius-md)]";
  const on = solid
    ? "bg-[var(--av-text)] text-white"
    : "bg-[var(--av-accent-soft)] text-[var(--av-accent)]";
  const off = solid
    ? "border border-[var(--av-border-strong)] bg-[var(--av-surface)] text-[var(--av-text)] hover:bg-[var(--av-bg)]"
    : "text-[var(--av-text-muted)] hover:bg-[var(--av-bg)] hover:text-[var(--av-text)]";
  return (
    <Link href={href} className={`${btnBase} ${btnH.sm} ${radius} ${active ? on : off}`}>
      {children}
    </Link>
  );
}
