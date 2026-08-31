export function DocumentUpload({
  orderId,
  returnTo,
  allowFinance = false,
}: {
  orderId: string;
  returnTo: string;
  allowFinance?: boolean;
}) {
  return (
    <form action="/api/documents" method="post" encType="multipart/form-data" className="mt-4 space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="block text-sm">
        Titel
        <input name="title" required placeholder="Korrektur, spec…" className="mt-1 h-10 w-full rounded-xl border border-[var(--av-border-strong)] px-3" />
      </label>
      <label className="block text-sm">
        Typ
        <select name="kind" className="mt-1 h-10 w-full rounded-xl border border-[var(--av-border-strong)] px-3">
          <option value="ARTWORK">Artwork</option>
          <option value="PROOF">Korrektur</option>
          <option value="PRODUCTION">Produktion</option>
          <option value="ORDER">Order</option>
          <option value="LOGISTICS">Logistik</option>
          {allowFinance ? <option value="FINANCE">Ekonomi</option> : null}
          <option value="OTHER">Övrigt</option>
        </select>
      </label>
      <label className="block text-sm">
        Fil
        <input required type="file" name="file" className="mt-1 block w-full text-sm" />
      </label>
      <button type="submit" className="inline-flex h-10 items-center rounded-[var(--av-radius-md)] bg-[var(--av-accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--av-accent-hover)]">
        Ladda upp
      </button>
    </form>
  );
}
