"use client";

import { useState } from "react";

type Preview = {
  productId: string;
  productName: string;
  qty: number;
  moq: number;
  unitPriceExVat: number | null;
  amountExVat: number | null;
  vatAmount: number | null;
  amountIncVat: number | null;
  listName: string;
  designId?: string;
  pricesHidden?: boolean;
};

export function CheckoutForm({
  preview,
  loggedIn,
  defaults,
}: {
  preview: Preview;
  loggedIn: boolean;
  defaults: { company?: string; email?: string };
}) {
  const [createAccount, setCreateAccount] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amount = preview.amountIncVat;
  const payBlocked = !loggedIn || Boolean(preview.pricesHidden) || amount == null || amount === 0;

  function formatPan(value: string) {
    return value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (payBlocked) return;
    const form = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/pay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          company: form.get("company"),
          email: form.get("email"),
          phone: form.get("phone"),
          city: form.get("city"),
          line1: form.get("line1"),
          postalCode: form.get("postalCode"),
          productId: preview.productId,
          qty: Number(form.get("qty") ?? preview.qty),
          designId: preview.designId,
          createAccount: loggedIn ? false : createAccount,
          password: form.get("password"),
          cardNumber,
          cardExp: form.get("cardExp"),
          cardCvc: form.get("cardCvc"),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        redirect?: string;
        createdAccount?: boolean;
        email?: string;
      };
      if (!res.ok || !data.redirect) throw new Error(data.error ?? "Kunde inte slutföra köpet.");
      if (data.createdAccount) {
        const password = String(form.get("password") ?? "");
        const csrf = (await (await fetch("/api/auth/csrf")).json()) as { csrfToken?: string };
        if (csrf.csrfToken && data.email && password) {
          await fetch("/api/auth/callback/credentials", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              csrfToken: csrf.csrfToken,
              email: data.email,
              password,
              callbackUrl: "/",
              json: "true",
            }),
          });
        }
      }
      window.location.href = data.redirect;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte slutföra köpet.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
      <input type="hidden" name="productId" value={preview.productId} />

      <label className="block text-sm">
        Företag
        <input required name="company" defaultValue={defaults.company} className="mt-1 h-12 w-full rounded-full border border-[var(--av-border)] px-4" />
      </label>
      <label className="block text-sm">
        E-post
        <input required type="email" name="email" defaultValue={defaults.email} className="mt-1 h-12 w-full rounded-full border border-[var(--av-border)] px-4" />
      </label>
      <label className="block text-sm">
        Telefon
        <input name="phone" className="mt-1 h-12 w-full rounded-full border border-[var(--av-border)] px-4" />
      </label>
      <label className="block text-sm">
        Antal
        <input name="qty" type="number" min={preview.moq} defaultValue={preview.qty} className="mt-1 h-12 w-full rounded-full border border-[var(--av-border)] px-4" />
      </label>
      <label className="block text-sm">
        Adress
        <input required name="line1" placeholder="Gata och nummer" className="mt-1 h-12 w-full rounded-full border border-[var(--av-border)] px-4" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          Postnummer
          <input required name="postalCode" className="mt-1 h-12 w-full rounded-full border border-[var(--av-border)] px-4" />
        </label>
        <label className="block text-sm">
          Ort
          <input required name="city" className="mt-1 h-12 w-full rounded-full border border-[var(--av-border)] px-4" />
        </label>
      </div>

      {loggedIn ? (
        <p className="rounded-[var(--av-radius-md)] bg-[var(--av-accent-soft)] px-4 py-3 text-[13px] text-[var(--av-accent)]">Ordern läggs på ditt inloggade konto.</p>
      ) : (
        <fieldset className="rounded-[22px] border border-[var(--av-border)] bg-[#f8f8fa] p-4">
          <legend className="px-1 text-[13px] font-semibold text-[#1d1d1f]">Vill du att vi skapar ett konto?</legend>
          <p className="text-[13px] leading-relaxed text-[#6b7280]">
            Kryssa i rutan om du vill ha ett ÅF-konto. Då kommer du rakt in i portalen efter köpet. Lämnar du den tom
            skapas ingen inloggning.
          </p>
          <label className="mt-3 flex items-start gap-3 text-sm text-[#1d1d1f]">
            <input
              type="checkbox"
              name="createAccount"
              checked={createAccount}
              onChange={(e) => setCreateAccount(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[var(--av-border)]"
            />
            <span>Ja, skapa ett konto så jag kommer in i dashboarden efter köpet.</span>
          </label>
          {createAccount ? (
            <label className="mt-4 block text-sm">
              Välj lösenord
              <input required minLength={8} type="password" name="password" className="mt-1 h-12 w-full rounded-full border border-[var(--av-border)] bg-white px-4" />
              <span className="mt-1 block text-[12px] text-[#6b7280]">Minst 8 tecken. Använd samma e-post som ovan.</span>
            </label>
          ) : null}
        </fieldset>
      )}

      <div className="rounded-[22px] border border-[#635BFF]/20 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#635BFF]">Stripe · testläge</p>
          <span className="text-[11px] text-[#6b7280]">Ingen affär sker</span>
        </div>
        <label className="mt-3 block text-sm">
          Kortnummer
          <input
            required
            inputMode="numeric"
            autoComplete="cc-number"
            name="cardNumber"
            placeholder="4242 4242 4242 4242"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatPan(e.target.value))}
            className="mt-1 h-12 w-full rounded-xl border border-[var(--av-border)] px-4 font-mono"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Utgång
            <input required name="cardExp" placeholder="MM/ÅÅ" autoComplete="cc-exp" className="mt-1 h-12 w-full rounded-xl border border-[var(--av-border)] px-4 font-mono" />
          </label>
          <label className="block text-sm">
            CVC
            <input required name="cardCvc" placeholder="123" inputMode="numeric" autoComplete="cc-csc" maxLength={4} className="mt-1 h-12 w-full rounded-xl border border-[var(--av-border)] px-4 font-mono" />
          </label>
        </div>
        <p className="mt-3 text-[12px] text-[#6b7280]">Använd Stripe-testkortet 4242 4242 4242 4242, valfritt datum och CVC. Kortet debiteras inte.</p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading || payBlocked}
        className="h-[52px] w-full rounded-full bg-[#635BFF] text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading
          ? "Bekräftar testdebitering…"
          : payBlocked
            ? "Logga in för pris"
            : `Betala ${amount.toFixed(2)} kr med Stripe-test`}
      </button>
    </form>
  );
}
