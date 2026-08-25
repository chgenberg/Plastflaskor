import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-[#1d1d1f]/15 px-4 pb-[3px] pt-[5px] text-[11px] font-semibold uppercase tracking-[0.22em] text-[#766a62]">
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
      <h1 className={`av-serif text-4xl leading-[1.1] tracking-[-0.01em] text-[#1d1d1f] md:text-5xl ${badge ? "mt-5" : ""}`}>
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
      ? "bg-[#1d1d1f] text-white hover:bg-black hover:text-white"
      : "border border-[#1d1d1f]/15 bg-white text-[#1d1d1f] hover:bg-black/[0.04]";
  return (
    <Link href={href} className={`inline-flex h-[52px] items-center justify-center rounded-full px-8 text-sm font-semibold transition-all ${cls}`}>
      {children}
    </Link>
  );
}

export function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[28px] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)] md:p-8 ${className}`}>{children}</div>;
}

export function EditorialShot({ src, alt, className = "mt-8 aspect-[16/10]" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[28px] ${className}`}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="800px" />
    </div>
  );
}
