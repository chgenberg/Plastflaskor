"use client";

import { useState } from "react";
import { Button } from "@/ui/shell/primitives";

export function SendToPrinterButton() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className="rounded-[var(--av-radius-md)] bg-[var(--av-status-done-bg)] px-3 py-2 text-[13px] font-medium text-[var(--av-status-done-fg)]">
        Skickat till printer (mock)
      </p>
    );
  }

  return (
    <Button type="button" size="lg" className="w-full" onClick={() => setSent(true)}>
      Skicka till printer
    </Button>
  );
}
