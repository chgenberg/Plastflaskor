import { redirect } from "next/navigation";
import { PageHeader, Panel } from "@/ui/shell/primitives";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  if (q?.trim()) redirect(`/operations/ordrar?q=${encodeURIComponent(q.trim())}`);

  return (
    <div className="space-y-8">
      <PageHeader title="Sök" subtitle="Hitta order, kund, ÅF, produkt, org.nr, tracking eller faktura." />
      <Panel>
        <form action="/operations/ordrar">
          <label className="block text-sm">
            Sökterm
            <input
              name="q"
              autoFocus
              placeholder="AV-10450, produkt, org.nr, tracking…"
              className="mt-2 h-11 w-full max-w-xl rounded-full border border-black/10 px-4 text-sm"
            />
          </label>
          <button type="submit" className="mt-4 inline-flex h-11 items-center rounded-full bg-[#5B7FD4] px-5 text-sm font-semibold text-white">
            Sök
          </button>
        </form>
      </Panel>
    </div>
  );
}
