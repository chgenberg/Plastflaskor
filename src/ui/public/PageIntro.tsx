import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-md border border-[var(--av-border-strong)] px-3 py-1 text-[12px] font-medium text-[var(--av-text-muted)]">
      {children}
    </span>
  );
}

export function PageIntro({
  badge,
  title,
  children,
  align = "left",
}: {
  badge?: string;
  title: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <header className={align === "center" ? "text-center" : ""}>
      {badge ? <Badge>{badge}</Badge> : null}
      <h1 className={`av-serif text-4xl leading-[1.1] tracking-[-0.01em] text-[var(--av-text)] md:text-5xl ${badge ? "mt-5" : ""}`}>
        {title}
      </h1>
      {children}
    </header>
  );
}

export function PillLink({
  href,
  children,
  variant = "ink",
}: {
  href: string;
  children: ReactNode;
  variant?: "ink" | "ghost";
}) {
  const cls =
    variant === "ink"
      ? "bg-[var(--av-accent)] text-white hover:bg-[var(--av-accent-hover)]"
      : "border border-[var(--av-border-strong)] bg-[var(--av-surface)] text-[var(--av-text)] hover:bg-[var(--av-bg)]";
  return (
    <Link href={href} className={`inline-flex h-12 items-center justify-center rounded-[var(--av-radius-md)] px-6 text-sm font-semibold transition ${cls}`}>
      {children}
    </Link>
  );
}

export function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`av-card p-6 md:p-8 ${className}`}>{children}</div>;
}

export function EditorialShot({ src, alt, className = "mt-8 aspect-[16/10]" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[var(--av-radius-lg)] ${className}`}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="800px" />
    </div>
  );
}
