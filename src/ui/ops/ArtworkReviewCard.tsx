import { approveArtworkAction, rejectArtworkAction } from "@/actions";
import { Button, controlClass } from "@/ui/shell/primitives";

export function ArtworkReviewCard({ orderNo }: { orderNo: string }) {
  return (
    <div className="mt-5 space-y-4">
      <form action={approveArtworkAction}>
        <input type="hidden" name="orderNo" value={orderNo} />
        <Button type="submit">Skicka korrektur till kund</Button>
      </form>
      <form action={rejectArtworkAction} className="space-y-2">
        <input type="hidden" name="orderNo" value={orderNo} />
        <label className="block text-sm">
          Vad ska kunden ändra
          <textarea name="note" required rows={3} className={`${controlClass} mt-1.5 h-auto min-h-[5rem] py-2`} />
        </label>
        <Button type="submit" variant="secondary">
          Neka och be om ny fil
        </Button>
      </form>
    </div>
  );
}
