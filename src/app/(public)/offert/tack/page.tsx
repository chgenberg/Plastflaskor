import { PageIntro } from "@/ui/public/PageIntro";

export default function ThanksPage() {
  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-16 text-center">
      <PageIntro title="Tack!" align="center" />
      <p className="mt-4 text-[var(--av-text-secondary)]">Vi återkommer med offert.</p>
    </main>
  );
}
