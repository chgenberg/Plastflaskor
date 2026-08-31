import { repeatOrderAction } from "@/actions";
import type { VisualSpec } from "@/domain/visualSpec";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { RepeatFields } from "@/ui/order/RepeatFields";
import { Button, controlClass } from "@/ui/shell/primitives";

export function RepeatOrderForm({
  sourceOrderId,
  spec,
  defaultQty,
  moq,
  prices,
  leadId,
}: {
  sourceOrderId: string;
  spec: VisualSpec | null;
  defaultQty: number;
  moq: number;
  prices?: Record<number, number | null>;
  leadId?: string;
}) {
  return (
    <div className="space-y-6">
      {spec ? <VisualSpecCard spec={spec} /> : null}
      <p className="text-sm text-[var(--av-text-muted)]">Samma artwork och flaskspec kopieras. Bara antal och kommentar kan ändras.</p>
      <form action={repeatOrderAction} className="space-y-4">
        <input type="hidden" name="sourceOrderId" value={sourceOrderId} />
        {leadId ? <input type="hidden" name="leadId" value={leadId} /> : null}
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
              className={`${controlClass} mt-1`}
              required
            />
          </label>
        )}
        <label className="block text-sm">
          <span className="text-[var(--av-text-muted)]">Kommentar</span>
          <textarea
            name="notes"
            placeholder="Önskemål / kommentar"
            className={`${controlClass} mt-1 h-auto py-2`}
            rows={3}
          />
        </label>
        <Button type="submit">Skicka beställning igen</Button>
      </form>
    </div>
  );
}
