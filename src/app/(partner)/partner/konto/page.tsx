import { prisma } from "@/server/db";
import { requireRole } from "@/server/rbac";
import { EmptyState, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function AccountPage() {
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const reseller = user.resellerId
    ? await prisma.reseller.findUnique({ where: { id: user.resellerId }, include: { company: true, priceList: true } })
    : null;
  return (
    <div className="mx-auto max-w-lg space-y-8">
      <PageHeader title="Konto" subtitle={user.email ?? undefined} />
      {!reseller ? (
        <EmptyState title="Ingen återförsäljare kopplad" body="Bolag och prislista visas för ÅF-konton." />
      ) : (
        <Panel>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Bolag</dt>
              <dd className="mt-1">{reseller.company.name}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Org.nr</dt>
              <dd className="mt-1">{reseller.company.orgNr}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Prislista</dt>
              <dd className="mt-1">{reseller.priceList.name}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">Kontakt Aqua</dt>
              <dd className="mt-1">info@aquavisibility.se · 08-400 204 80</dd>
            </div>
          </dl>
        </Panel>
      )}
    </div>
  );
}
