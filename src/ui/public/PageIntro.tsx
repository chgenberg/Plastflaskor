import Image from "next/image";
import type { ReactNode } from "react";
import { LinkButton } from "@/ui/shell/primitives";

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
      <h1 className={`av-serif text-4xl leading-[1.08] tracking-[-0.02em] text-[var(--av-text)] md:text-[52px] ${badge ? "mt-5" : ""}`}>
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
  return (
    <LinkButton href={href} size="lg" variant={variant === "ink" ? "primary" : "secondary"}>
      {children}
    </LinkButton>
  );
}

export function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`av-card p-6 md:p-8 ${className}`}>{children}</div>;
}

export function EditorialShot({ src, alt, className = "mt-8 aspect-[16/10]" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`av-media ${className}`}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="800px" />
    </div>
  );
}

export function PublicPage({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return <main className={narrow ? "av-public-page av-public-page--narrow" : "av-public-page"}>{children}</main>;
}
