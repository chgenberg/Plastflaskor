"use client";

import { Button } from "@/ui/shell/primitives";

export function PrintButton() {
  return (
    <Button type="button" variant="secondary" size="lg" className="mt-6" onClick={() => window.print()}>
      Skriv ut
    </Button>
  );
}
