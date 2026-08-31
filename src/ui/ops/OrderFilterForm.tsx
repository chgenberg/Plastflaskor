import { PIPELINE_PHASES, ORDER_STEP_LABELS, ORDER_STEPS } from "@/domain/enums";
import { Button, controlClass } from "@/ui/shell/primitives";

export function OrderFilterForm({
  action = "/operations/ordrar",
  values,
  factories,
}: {
  action?: string;
  values: {
    q?: string;
    phase?: string;
    status?: string;
    from?: string;
    to?: string;
    buyer?: string;
    size?: string;
    wall?: string;
    eco?: string;
    factory?: string;
    invoice?: string;
    late?: string;
  };
  factories: { id: string; name: string }[];
}) {
  return (
    <form action={action} className="av-card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
      <input
        name="q"
        defaultValue={values.q}
        placeholder="Sök order, kund, ÅF, produkt, org.nr, tracking, faktura"
        className={`${controlClass} sm:col-span-2 lg:col-span-4`}
      />
      <select name="phase" defaultValue={values.phase ?? ""} className={controlClass}>
        <option value="">Alla faser</option>
        {PIPELINE_PHASES.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <select name="status" defaultValue={values.status ?? ""} className={controlClass}>
        <option value="">Alla statusar</option>
        {ORDER_STEPS.map((s) => (
          <option key={s} value={s}>
            {ORDER_STEP_LABELS[s]}
          </option>
        ))}
      </select>
      <select name="buyer" defaultValue={values.buyer ?? ""} className={controlClass}>
        <option value="">ÅF och direktkund</option>
        <option value="RESELLER">Återförsäljare</option>
        <option value="CUSTOMER">Direktkund</option>
      </select>
      <select name="size" defaultValue={values.size ?? ""} className={controlClass}>
        <option value="">Alla storlekar</option>
        <option value="12">12 cl</option>
        <option value="23">23 cl</option>
        <option value="35">35 cl</option>
      </select>
      <select name="wall" defaultValue={values.wall ?? ""} className={controlClass}>
        <option value="">Enkel- och dubbelvägg</option>
        <option value="enkel">Enkelvägg</option>
        <option value="dubbel">Dubbelvägg</option>
      </select>
      <select name="eco" defaultValue={values.eco ?? ""} className={controlClass}>
        <option value="">ECO och standard</option>
        <option value="ja">ECO</option>
        <option value="nej">Ej ECO</option>
      </select>
      <select name="invoice" defaultValue={values.invoice ?? ""} className={controlClass}>
        <option value="">Alla fakturastatusar</option>
        <option value="NOT_READY">Ej fakturerad</option>
        <option value="READY">Redo</option>
        <option value="ISSUED">Utfärdad</option>
        <option value="PARTIALLY_PAID">Delvis betald</option>
        <option value="PAID">Betald</option>
      </select>
      <select name="late" defaultValue={values.late ?? ""} className={controlClass}>
        <option value="">I tid och försenade</option>
        <option value="1">Försenade</option>
        <option value="0">I tid</option>
      </select>
      {factories.length > 1 ? (
        <select name="factory" defaultValue={values.factory ?? ""} className={controlClass}>
          <option value="">Alla tryckerier</option>
          {factories.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      ) : null}
      <label className="text-[13px] text-[var(--av-text-muted)]">
        Leverans från
        <input type="date" name="from" defaultValue={values.from} className={`${controlClass} mt-1 text-[var(--av-text)]`} />
      </label>
      <label className="text-[13px] text-[var(--av-text-muted)]">
        Leverans till
        <input type="date" name="to" defaultValue={values.to} className={`${controlClass} mt-1 text-[var(--av-text)]`} />
      </label>
      <div className="flex items-end">
        <Button type="submit">Filtrera</Button>
      </div>
    </form>
  );
}
