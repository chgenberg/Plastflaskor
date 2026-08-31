import Link from "next/link";
import { AiStudio } from "@/ui/studio/AiStudio";

export default function AiPage() {
  return (
    <main className="h-dvh overflow-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/designa" className="text-sm text-[var(--av-accent)]">
          ← Tillbaka till designmotorn
        </Link>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--av-text-muted)]">
          AI-studio är ett tillval — inte kärnan i designflödet. Primär väg är att ladda upp tryckfil i designmotorn.
        </p>
        <div className="mt-4">
          <AiStudio productName="Pappersmugg EV 23 cl" />
        </div>
      </div>
    </main>
  );
}
