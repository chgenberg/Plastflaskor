import Image from "next/image";
import Link from "next/link";
import { PublicNav } from "./PublicNav";

export function PublicHeader({ email }: { email?: string | null }) {
  return <PublicNav email={email} />;
}

export function PublicFooter() {
  return (
    <footer className="mt-28 border-t border-[var(--av-border)] bg-[var(--av-surface)]">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <Image src="/brand/aqua-visibility-logo.png" alt="aqua visibility" width={140} height={46} />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-[var(--av-text-secondary)]">
            Aqua Visibility utvecklar, marknadsför och distribuerar dryck med kundanpassad förpackning och etikett.
          </p>
        </div>
        <div className="text-sm">
          <p className="av-label">Kontakt</p>
          <p className="mt-4 text-[var(--av-text-secondary)]">+46 (0)8 400 204 80</p>
          <p className="text-[var(--av-text-secondary)]">info@aquavisibility.se</p>
          <p className="mt-3 text-[var(--av-text-secondary)]">
            Fågelsångsvägen 6 - lokal 26
            <br />
            186 42 Vallentuna
          </p>
        </div>
        <div className="text-sm">
          <p className="av-label">Portal</p>
          <div className="mt-4 flex flex-col gap-2 text-[var(--av-text-secondary)]">
            <Link href="/login" className="font-medium text-[var(--av-text)] hover:text-[var(--av-accent)]">
              Logga in till kundportalen
            </Link>
            <Link href="/aterforsaljare" className="hover:text-[var(--av-text)]">För återförsäljare</Link>
            <Link href="/offert" className="hover:text-[var(--av-text)]">Begär offert</Link>
            <Link href="/inspiration" className="hover:text-[var(--av-text)]">Inspiration</Link>
          </div>
        </div>
      </div>
      <p className="border-t border-[var(--av-border)] py-5 text-center text-[12px] text-[var(--av-text-muted)]">
        Copyright 2026 © Aqua Visibility
      </p>
    </footer>
  );
}
