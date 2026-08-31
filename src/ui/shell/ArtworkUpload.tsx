export function ArtworkUpload({ orderId, returnTo }: { orderId: string; returnTo: string }) {
  return (
    <form action="/api/artwork" method="post" encType="multipart/form-data" className="mt-4 space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="block text-sm">
        Tryckfil (PNG, JPG, SVG, PDF, AI)
        <input required type="file" name="file" accept=".png,.jpg,.jpeg,.svg,.pdf,.ai" className="mt-1 block w-full text-sm" />
      </label>
      <button type="submit" className="inline-flex h-10 items-center rounded-[var(--av-radius-md)] bg-[var(--av-accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--av-accent-hover)]">
        Ladda upp tryckfil
      </button>
    </form>
  );
}
