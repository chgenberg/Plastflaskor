import { prisma } from "@/server/db";
import { requireRole } from "@/server/rbac";

export default async function AccountPage() {
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const reseller = user.resellerId
    ? await prisma.reseller.findUnique({ where: { id: user.resellerId }, include: { company: true, priceList: true } })
    : null;
  return (
    <div className="max-w-lg rounded-2xl bg-white p-6">
      <h1 className="text-3xl font-semibold">Konto</h1>
      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="text-[var(--av-text-muted)]">Bolag</dt>
          <dd>{reseller?.company.name}</dd>
        </div>
        <div>
          <dt className="text-[var(--av-text-muted)]">Org.nr</dt>
          <dd>{reseller?.company.orgNr}</dd>
        </div>
        <div>
          <dt className="text-[var(--av-text-muted)]">Prislista</dt>
          <dd>{reseller?.priceList.name}</dd>
        </div>
        <div>
          <dt className="text-[var(--av-text-muted)]">Kontakt Aqua</dt>
          <dd>info@aquavisibility.se · 08-400 204 80</dd>
        </div>
      </dl>
    </div>
  );
}
