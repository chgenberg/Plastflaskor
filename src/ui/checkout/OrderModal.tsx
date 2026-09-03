"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  lookupCompanyAction,
  placeCheckoutOrderAction,
  previewPriceAction,
  registerCheckoutAction,
  type CheckoutState,
} from "@/actions/checkout";
import type { ProductSelection } from "@/domain/productSelection";
import { Button, controlClass } from "@/ui/shell/primitives";

const idle: CheckoutState = { ok: false };

export function OrderModal({
  selection,
  me,
  onClose,
  embedded = false,
}: {
  selection: ProductSelection;
  me: { email: string; customerId: string | null } | null;
  onClose?: () => void;
  embedded?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tokenRef = useRef(crypto.randomUUID());
  const [step, setStep] = useState<"account" | "order">(me?.customerId ? "order" : "account");
  const [loginMode, setLoginMode] = useState(false);
  const [quote, setQuote] = useState<{ unitPriceExVat: number; lineExVat: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [address, setAddress] = useState({ line1: "", postalCode: "", city: "" });

  const [regState, regAction, regPending] = useActionState(registerCheckoutAction, idle);
  const [orderState, orderAction, orderPending] = useActionState(placeCheckoutOrderAction, idle);

  useEffect(() => {
    if (embedded) return;
    const el = dialogRef.current;
    if (!el) return;
    if (!el.open) el.showModal();
  }, [embedded]);

  useEffect(() => {
    if (regState.ok) {
      setStep("order");
      setLocalError(null);
      void previewPriceAction({ variantId: selection.variantId, qty: selection.qty }).then(setQuote);
    } else if (regState.code === "EMAIL_TAKEN") {
      setLoginMode(true);
    }
  }, [regState, selection.qty, selection.variantId]);

  useEffect(() => {
    if (!me?.customerId) return;
    void previewPriceAction({ variantId: selection.variantId, qty: selection.qty }).then(setQuote);
  }, [me?.customerId, selection.qty, selection.variantId]);

  const pending = regPending || orderPending || busy;
  const error = localError ?? (step === "account" ? regState.error : orderState.error);
  const fieldErrors = step === "account" ? regState.fieldErrors : orderState.fieldErrors;

  async function onOrgNrBlur(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 10) return;
    setBusy(true);
    const res = await lookupCompanyAction(digits);
    setBusy(false);
    if (res.ok && res.hit) {
      const form = document.getElementById("av-checkout-account") as HTMLFormElement | null;
      if (form) {
        const company = form.elements.namedItem("company") as HTMLInputElement | null;
        if (company && !company.value) company.value = res.hit.name;
      }
      setAddress({ line1: res.hit.line1, postalCode: res.hit.postalCode, city: res.hit.city });
    }
  }

  function onCancel(event: React.SyntheticEvent<HTMLDialogElement>) {
    if (pending) {
      event.preventDefault();
      return;
    }
    onClose?.();
  }

  const body = (
    <div className="av-peek-panel">
      {!embedded ? (
        <div className="av-peek-bar">
          <h2 id="av-checkout-title" className="av-peek-title">
            {step === "account" ? (loginMode ? "Logga in och visa pris" : "Skapa konto") : "Bekräfta order"}
          </h2>
          <button type="button" className="av-peek-close" onClick={() => (pending ? undefined : onClose?.())}>
            Stäng
          </button>
        </div>
      ) : (
        <h1 id="av-checkout-title" className="av-serif text-2xl tracking-[-0.02em]">
          {step === "account" ? "Skapa konto och visa pris" : "Bekräfta order"}
        </h1>
      )}
      <div className="av-peek-body space-y-4">
        {error ? (
          <p role="alert" className="text-sm text-[var(--av-status-blocked-fg)]">
            {error}
          </p>
        ) : null}

        {step === "account" ? (
          <form id="av-checkout-account" action={regAction} className="space-y-3">
            <input type="hidden" name="clientToken" value={tokenRef.current} />
            <input type="hidden" name="variantId" value={selection.variantId} />
            <input type="hidden" name="qty" value={String(selection.qty)} />
            {loginMode ? <input type="hidden" name="login" value="on" /> : null}
            {!loginMode ? (
              <>
                <label className="block text-sm font-medium">
                  Organisationsnummer
                  <input
                    name="orgNr"
                    required
                    inputMode="numeric"
                    autoComplete="off"
                    className={`${controlClass} mt-1.5`}
                    onBlur={(e) => void onOrgNrBlur(e.target.value)}
                  />
                  {fieldErrors?.orgNr ? <span className="mt-1 block text-[12px] text-[var(--av-status-blocked-fg)]">{fieldErrors.orgNr}</span> : null}
                </label>
                <label className="block text-sm font-medium">
                  Företag
                  <input name="company" required className={`${controlClass} mt-1.5`} />
                </label>
                <label className="block text-sm font-medium">
                  Ditt namn
                  <input name="contactName" required autoComplete="name" className={`${controlClass} mt-1.5`} />
                </label>
                <label className="block text-sm font-medium">
                  Telefon
                  <input name="phone" type="tel" required autoComplete="tel" className={`${controlClass} mt-1.5`} />
                </label>
              </>
            ) : (
              <>
                <input type="hidden" name="company" value="Befintligt konto" />
                <input type="hidden" name="orgNr" value="559888-0101" />
                <input type="hidden" name="contactName" value="Befintlig kund" />
                <input type="hidden" name="phone" value="0700000000" />
              </>
            )}
            <label className="block text-sm font-medium">
              E-post
              <input name="email" type="email" required autoComplete="username" className={`${controlClass} mt-1.5`} />
            </label>
            <label className="block text-sm font-medium">
              Lösenord
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete={loginMode ? "current-password" : "new-password"}
                className={`${controlClass} mt-1.5`}
              />
            </label>
            <p className="text-[12px] text-[var(--av-text-muted)]">Priset visas i nästa steg, när kontot är skapat.</p>
            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {loginMode ? "Logga in och visa pris" : "Skapa konto och visa pris"}
            </Button>
          </form>
        ) : (
          <form action={orderAction} className="space-y-3">
            <input type="hidden" name="clientToken" value={tokenRef.current} />
            <input type="hidden" name="variantId" value={selection.variantId} />
            <input type="hidden" name="qty" value={String(selection.qty)} />
            <input type="hidden" name="waterType" value={selection.options.waterType} />
            {selection.options.cap ? <input type="hidden" name="cap" value={selection.options.cap} /> : null}
            {selection.options.color ? <input type="hidden" name="color" value={selection.options.color} /> : null}
            {selection.designId ? <input type="hidden" name="designId" value={selection.designId} /> : null}
            {me?.email ? (
              <p className="text-sm text-[var(--av-text-secondary)]">Inloggad som {me.email} — ordern kopplas till ditt konto.</p>
            ) : null}
            {quote ? (
              <p aria-live="polite" className="text-sm font-medium">
                {quote.lineExVat.toLocaleString("sv-SE")} exkl. moms ({quote.unitPriceExVat.toLocaleString("sv-SE")} / st · {selection.qty} st)
              </p>
            ) : (
              <p className="text-sm text-[var(--av-text-muted)]">Kontakta oss för pris vid detta antal.</p>
            )}
            <label className="block text-sm font-medium">
              Leveransadress
              <input
                name="line1"
                required
                value={address.line1}
                onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                className={`${controlClass} mt-1.5`}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium">
                Postnummer
                <input
                  name="postalCode"
                  required
                  inputMode="numeric"
                  value={address.postalCode}
                  onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))}
                  className={`${controlClass} mt-1.5`}
                />
              </label>
              <label className="block text-sm font-medium">
                Ort
                <input
                  name="city"
                  required
                  value={address.city}
                  onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                  className={`${controlClass} mt-1.5`}
                />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Fakturareferens
              <input name="invoiceRef" required maxLength={80} className={`${controlClass} mt-1.5`} />
            </label>
            <label className="block text-sm">
              Artwork (valfritt, kan skickas senare)
              <input name="artwork" type="file" accept=".pdf,.ai,.eps,.png,.jpg,.jpeg,.tif,.tiff" className="mt-1.5 text-sm" />
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="acceptTerms" value="on" required className="mt-1 h-4 w-4" />
              <span>Jag godkänner villkoren och beställer</span>
            </label>
            <p className="text-[12px] text-[var(--av-text-muted)]">
              Agenten meddelar Aqua. Slutlig orderbekräftelse med korrektur kommer inom 24 timmar. Inget att betala nu.
            </p>
            <Button type="submit" size="lg" className="av-checkout-submit w-full" disabled={pending || !quote}>
              Beställ
            </Button>
          </form>
        )}
      </div>
    </div>
  );

  if (embedded) return <div className="av-card p-7">{body}</div>;

  return (
    <dialog
      ref={dialogRef}
      className="av-peek av-peek--checkout"
      aria-labelledby="av-checkout-title"
      onCancel={onCancel}
      onClick={(event) => {
        if (pending) return;
        if (event.target === event.currentTarget) {
          event.currentTarget.close();
          onClose?.();
        }
      }}
    >
      {body}
    </dialog>
  );
}
