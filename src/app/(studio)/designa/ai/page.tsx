import Link from "next/link";
import { AiStudio } from "@/ui/studio/AiStudio";

export default function AiPage() {
  return (
    <main className="h-dvh overflow-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/designa" className="text-sm text-[#3B5BAA]">
          ← Tillbaka till designmotorn
        </Link>
        <div className="mt-4">
          <AiStudio productName="Naturligt Mineralvatten 33cl" />
        </div>
      </div>
    </main>
  );
}
