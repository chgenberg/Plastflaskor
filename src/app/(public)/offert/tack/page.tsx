import { PageIntro } from "@/ui/public/PageIntro";

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return (
    <main className="mx-auto max-w-xl px-4 pb-20 pt-36 text-center">
      <PageIntro title="Tack!" align="center" />
      <p className="mt-4 text-[var(--av-text-secondary)]">
        Vi återkommer med offert. {order ? `Referens: ${order}` : null}
      </p>
    </main>
  );
}
