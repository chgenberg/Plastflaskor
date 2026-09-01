import { ORDER_LIST_LANES } from "@/domain/enums";
import { Button, FilterChip, controlCompact } from "@/ui/shell/primitives";

type FilterValues = {
  q?: string;
  lane?: string;
  phase?: string;
  from?: string;
  to?: string;
  size?: string;
  waterType?: string;
  factory?: string;
  late?: string;
};

function hrefFor(values: FilterValues, lane: string | undefined) {
  const p = new URLSearchParams();
  if (values.q) p.set("q", values.q);
  if (lane) p.set("lane", lane);
  if (values.size) p.set("size", values.size);
  if (values.waterType) p.set("waterType", values.waterType);
  if (values.factory) p.set("factory", values.factory);
  if (values.late) p.set("late", values.late);
  if (values.from) p.set("from", values.from);
  if (values.to) p.set("to", values.to);
  const qs = p.toString();
  return qs ? `/operations/ordrar?${qs}` : "/operations/ordrar";
}

export function OrderFilterForm({
  action = "/operations/ordrar",
  values,
  factories,
}: {
  action?: string;
  values: FilterValues;
  factories: { id: string; name: string }[];
}) {
  const lane = values.lane ?? "";
  return (
    <div className="av-card space-y-2.5 p-3">
      <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {lane ? <input type="hidden" name="lane" value={lane} /> : null}
        {values.size ? <input type="hidden" name="size" value={values.size} /> : null}
        {values.waterType ? <input type="hidden" name="waterType" value={values.waterType} /> : null}
        {values.factory ? <input type="hidden" name="factory" value={values.factory} /> : null}
        {values.late ? <input type="hidden" name="late" value={values.late} /> : null}
        <input
          name="q"
          defaultValue={values.q}
          placeholder="Sök ordernr, kund, produkt, org.nr, tracking…"
          className={controlCompact}
        />
        <Button type="submit" size="sm">Sök</Button>
      </form>
      <div className="flex flex-wrap gap-1.5">
        <FilterChip href={hrefFor(values, undefined)} active={!lane && !values.phase} solid>
          Alla
        </FilterChip>
        {ORDER_LIST_LANES.map((item) => (
          <FilterChip key={item.id} href={hrefFor(values, item.id)} active={lane === item.id} solid>
            {item.label}
          </FilterChip>
        ))}
      </div>
      <form action={action} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {values.q ? <input type="hidden" name="q" value={values.q} /> : null}
        {lane ? <input type="hidden" name="lane" value={lane} /> : null}
        <select name="size" defaultValue={values.size ?? ""} className={controlCompact}>
          <option value="">Alla storlekar</option>
          <option value="33">33 cl</option>
          <option value="50">50 cl</option>
        </select>
        <select name="waterType" defaultValue={values.waterType ?? ""} className={controlCompact}>
          <option value="">Stilla och kolsyrat</option>
          <option value="stilla">Stilla</option>
          <option value="kolsyrat">Kolsyrat</option>
        </select>
        <select name="late" defaultValue={values.late ?? ""} className={controlCompact}>
          <option value="">I tid och försenade</option>
          <option value="1">Försenade</option>
          <option value="0">I tid</option>
        </select>
        {factories.length > 1 ? (
          <select name="factory" defaultValue={values.factory ?? ""} className={controlCompact}>
            <option value="">Alla bottlers</option>
            {factories.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        ) : null}
        <Button type="submit" variant="secondary" size="sm">
          Fler filter
        </Button>
      </form>
    </div>
  );
}
