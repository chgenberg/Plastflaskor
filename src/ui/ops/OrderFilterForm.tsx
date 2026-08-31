import { PIPELINE_PHASES, ORDER_STEP_LABELS, ORDER_STEPS } from "@/domain/enums";

const SELECT = "h-11 w-full rounded-full border border-black/10 bg-white px-4 text-sm";

export function OrderFilterForm({
  action = "/operations/ordrar",
  values,
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
    <form action={action} className="grid gap-3 rounded-[22px] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.04)] sm:grid-cols-2 lg:grid-cols-4">
      <input name="q" defaultValue={values.q} placeholder="Sök order, kund, ÅF, produkt, org.nr, kontakt, tracking, faktura" className={`${SELECT} sm:col-span-2 lg:col-span-4`} />
      <select name="phase" defaultValue={values.phase ?? ""} className={SELECT}>
        <option value="">Alla faser</option>
        {PIPELINE_PHASES.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <select name="status" defaultValue={values.status ?? ""} className={SELECT}>
        <option value="">Alla statusar</option>
        {ORDER_STEPS.map((s) => (
          <option key={s} value={s}>
            {ORDER_STEP_LABELS[s]}
          </option>
        ))}
      </select>
      <select name="buyer" defaultValue={values.buyer ?? ""} className={SELECT}>
        <option value="">ÅF och direktkund</option>
        <option value="RESELLER">Återförsäljare</option>
        <option value="CUSTOMER">Direktkund</option>
      </select>
      <select name="size" defaultValue={values.size ?? ""} className={SELECT}>
        <option value="">Alla storlekar</option>
        <option value="12">12 cl</option>
        <option value="23">23 cl</option>
        <option value="35">35 cl</option>
      </select>
      <select name="wall" defaultValue={values.wall ?? ""} className={SELECT}>
        <option value="">Enkel- och dubbelvägg</option>
        <option value="enkel">Enkelvägg</option>
        <option value="dubbel">Dubbelvägg</option>
      </select>
      <select name="eco" defaultValue={values.eco ?? ""} className={SELECT}>
        <option value="">ECO och standard</option>
        <option value="ja">ECO</option>
        <option value="nej">Ej ECO</option>
      </select>
      <select name="invoice" defaultValue={values.invoice ?? ""} className={SELECT}>
        <option value="">Alla fakturastatusar</option>
        <option value="NOT_READY">Ej fakturerad</option>
        <option value="READY">Redo</option>
        <option value="ISSUED">Utfärdad</option>
        <option value="PARTIALLY_PAID">Delvis betald</option>
        <option value="PAID">Betald</option>
      </select>
      <select name="late" defaultValue={values.late ?? ""} className={SELECT}>
        <option value="">I tid och försenade</option>
        <option value="1">Försenade</option>
        <option value="0">I tid</option>
      </select>
      <label className="text-sm text-[#6b7280]">
        Leverans från
        <input type="date" name="from" defaultValue={values.from} className={`${SELECT} mt-1 text-[#1d1d1f]`} />
      </label>
      <label className="text-sm text-[#6b7280]">
        Leverans till
        <input type="date" name="to" defaultValue={values.to} className={`${SELECT} mt-1 text-[#1d1d1f]`} />
      </label>
      <div className="flex items-end">
        <button type="submit" className="h-11 rounded-full bg-[#5B7FD4] px-5 text-sm font-semibold text-white">
          Filtrera
        </button>
      </div>
    </form>
  );
}
