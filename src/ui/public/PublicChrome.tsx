import Image from "next/image";
import Link from "next/link";
import { PublicNav } from "./PublicNav";

const TICKER = [
  "Från 270 flaskor med egen etikett",
  "Mineralvatten från Tollagården i Dalarna",
  "Läsk och julmust från Mora Bryggeri",
  "Pappersmuggar av FSC-märkt kartong",
  "Svenska och europeiska leverantörer",
  "Superb service är vårt främsta fokus",
];

function TickerDot() {
  return <span className="mx-8 inline-block h-[3px] w-[3px] -translate-y-[2px] rounded-full bg-[#766a62]/40 align-middle" />;
}

export function PublicTicker() {
  const loop = [...TICKER, ...TICKER];
  return (
    <div className="relative z-50 overflow-hidden border-b border-[#e6e6e6]/60 bg-[#f5f5f7] py-[7px]">
      <div className="av-marquee flex w-max whitespace-nowrap">
        {[0, 1].map((copy) => (
          <span key={copy} className="flex shrink-0 items-center">
            {loop.map((item, i) => (
              <span key={`${copy}-${i}`} className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#766a62]">
                {item}
                <TickerDot />
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PublicHeader({ email }: { email?: string | null }) {
  return (
    <>
      <PublicTicker />
      <PublicNav email={email} />
    </>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--av-border)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-3">
        <div>
          <Image src="/brand/aqua-visibility-logo.png" alt="aqua visibility" width={140} height={46} />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-[var(--av-text-secondary)]">
            Aqua Visibility utvecklar, marknadsför och distribuerar dryck med kundanpassad förpackning och etikett.
          </p>
        </div>
        <div className="text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#766a62]">Kontakt</p>
          <p className="mt-3 text-[var(--av-text-secondary)]">+46 (0)8 400 204 80</p>
          <p className="text-[var(--av-text-secondary)]">info@aquavisibility.se</p>
          <p className="mt-3 text-[var(--av-text-secondary)]">
            Fågelsångsvägen 6 - lokal 26
            <br />
            186 42 Vallentuna
          </p>
        </div>
        <div className="text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#766a62]">Sidor</p>
          <div className="mt-3 flex flex-col gap-2 text-[var(--av-text-secondary)]">
            <Link href="/aterforsaljare">För återförsäljare</Link>
            <Link href="/kassa">Beställ</Link>
            <Link href="/offert">Begär offert</Link>
            <Link href="/partner">ÅF-portal</Link>
          </div>
        </div>
      </div>
      <p className="border-t border-[var(--av-border)] py-5 text-center text-[11px] uppercase tracking-[0.14em] text-[#766a62]">
        Copyright 2026 © Aqua Visibility
      </p>
    </footer>
  );
}
