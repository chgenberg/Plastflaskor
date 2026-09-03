"use client";

import { useState } from "react";
import { Button } from "@/ui/shell/primitives";

const MAX_BYTES = 20 * 1024 * 1024;

export function ArtworkUpload({ orderId, returnTo }: { orderId: string; returnTo: string }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      action="/api/artwork"
      method="post"
      encType="multipart/form-data"
      className="mt-4 space-y-3"
      onSubmit={(event) => {
        const input = event.currentTarget.elements.namedItem("file") as HTMLInputElement | null;
        const file = input?.files?.[0];
        if (file && file.size > MAX_BYTES) {
          event.preventDefault();
          setError("Filen är större än 20 MB.");
        }
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="block text-sm" htmlFor={`artwork-${orderId}`}>
        Artwork (PNG, JPG, SVG, PDF, AI)
        <input
          id={`artwork-${orderId}`}
          required
          type="file"
          name="file"
          accept=".png,.jpg,.jpeg,.svg,.pdf,.ai"
          className="mt-1 block w-full text-sm"
          aria-describedby={`artwork-help-${orderId}`}
          onChange={() => setError(null)}
        />
      </label>
      <p id={`artwork-help-${orderId}`} className="text-[12px] text-[var(--av-text-muted)]">
        Största fil 20 MB. PNG, JPG, SVG, PDF eller AI.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-[var(--av-status-blocked-fg)]">
          {error}
        </p>
      ) : null}
      <Button type="submit">Ladda upp artwork</Button>
    </form>
  );
}
