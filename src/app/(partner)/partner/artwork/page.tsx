import { prisma } from "@/server/db";
import { requireRole } from "@/server/rbac";

export default async function ArtworkPage() {
  await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const designs = await prisma.design.findMany({ include: { files: true }, orderBy: { createdAt: "desc" }, take: 30 });
  return (
    <div>
      <h1 className="text-3xl font-semibold">Artwork</h1>
      <p className="mt-2 text-sm text-[var(--av-text-secondary)]">Mallar och tidigare designer. Publik /mallar är flyttad hit.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {designs.map((d) => (
          <article key={d.id} className="rounded-2xl bg-white p-4">
            <p className="font-medium">{d.projectName}</p>
            <p className="text-xs text-[var(--av-text-muted)]">{d.status}</p>
          </article>
        ))}
        {designs.length === 0 ? <p className="text-sm text-[var(--av-text-muted)]">Inga designer ännu. Starta i studion.</p> : null}
      </div>
    </div>
  );
}
