"use client";

import { useState } from "react";
import { invoiceAction } from "@/actions";
import { Button } from "@/ui/shell/primitives";

export function FortnoxInvoiceForm({ orderNo }: { orderNo: string }) {
  const [phase, setPhase] = useState<"idle" | "creating" | "done">("idle");

  return (
    <form
      action={invoiceAction}
      className="mt-6 space-y-3"
      onSubmit={() => setPhase("creating")}
    >
      <input type="hidden" name="orderNo" value={orderNo} />
      <ol className="space-y-1.5 text-sm">
        <li className="text-[var(--av-status-done-fg)]">Fortnox API Connected</li>
        <li className={phase === "creating" || phase === "done" ? "text-[var(--av-text)]" : "text-[var(--av-text-muted)]"}>
          {phase === "creating" ? "Creating Invoice…" : "Creating Invoice"}
        </li>
        <li className={phase === "done" ? "text-[var(--av-status-done-fg)]" : "text-[var(--av-text-muted)]"}>
          Invoice Created ✓
        </li>
      </ol>
      <Button type="submit" className="w-full" disabled={phase === "creating"}>
        {phase === "creating" ? "Skapar faktura…" : "Invoice"}
      </Button>
    </form>
  );
}
