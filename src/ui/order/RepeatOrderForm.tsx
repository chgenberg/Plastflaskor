import { repeatOrderAction } from "@/actions";
import type { VisualSpec } from "@/domain/visualSpec";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { RepeatFields } from "@/ui/partner/RepeatFields";
import { Button } from "@/ui/shell/primitives";

export function RepeatOrderForm({
  sourceOrderId,
  spec,
  defaultQty,
  moq,
  prices,
}: {
  sourceOrderId: string;
  spec: VisualSpec | null;
  defaultQty: number;
  moq: number;
  prices?: Record<number, number | null>;
}) {
  return (
    <div className="space-y-6">
      {spec ? <VisualSpecCard spec={spec} /> : null}
      <p className="text-sm text-[var(--av-text-muted)]">Samma tryckfil och spec kopieras. Bara antal och kommentar kan ändras.</p>
      <form action={repeatOrderAction} className="space-y-4">
        <input type="hidden" name="sourceOrderId" value={sourceOrderId} />
        {prices ? (
          <RepeatFields defaultQty={defaultQty} prices={prices} moq={moq} />
        ) : (
          <label className="block text-sm">
            <span className="text-[var(--av-text-muted)]">Antal</span>
            <input
              name="qty"
              type="number"
              defaultValue={Math.max(defaultQty, moq)}
              min={moq}
              className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2"
              required
            />
          </label>
        )}
        <label className="block text-sm">
          <span className="text-[var(--av-text-muted)]">Kommentar</span>
          <textarea
            name="notes"
            placeholder="Önskemål / kommentar"
            className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2 text-sm"
            rows={3}
          />
        </label>
        <Button type="submit">Skicka beställning igen</Button>
      </form>
    </div>
  );
}
