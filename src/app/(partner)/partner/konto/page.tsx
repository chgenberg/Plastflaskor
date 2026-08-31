import { prisma } from "@/server/db";
import { requireRole } from "@/server/rbac";
import { addAddressAction } from "@/actions";
import { priceListDisplayName } from "@/domain/priceLists";
import { Button, EmptyState, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function AccountPage() {
  const user = await requireRole(["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]);
  const reseller = user.resellerId
    ? await prisma.reseller.findUnique({
        where: { id: user.resellerId },
        include: { company: { include: { addresses: true } }, priceList: true },
      })
    : null;
  return (
    <div className="mx-auto max-w-lg space-y-8">
      <PageHeader title="Konto" subtitle={user.email ?? undefined} />
      {!reseller ? (
        <EmptyState title="Ingen återförsäljare kopplad" body="Bolag och prislista visas för ÅF-konton." />
      ) : (
        <>
          <Panel>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="av-label">Bolag</dt>
                <dd className="mt-1">{reseller.company.name}</dd>
              </div>
              <div>
                <dt className="av-label">Org.nr</dt>
                <dd className="mt-1">{reseller.company.orgNr}</dd>
              </div>
              <div>
                <dt className="av-label">Prislista</dt>
                <dd className="mt-1">{priceListDisplayName(reseller.priceList.name)}</dd>
              </div>
              <div>
                <dt className="av-label">Kontakt Aqua</dt>
                <dd className="mt-1">info@aquavisibility.se · 08-400 204 80</dd>
              </div>
            </dl>
          </Panel>
          <Panel title="Adresser">
            {reseller.company.addresses.length === 0 ? (
              <p className="text-sm text-[var(--av-text-muted)]">Inga sparade adresser.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {reseller.company.addresses.map((a) => (
                  <li key={a.id}>
                    <span className="text-[var(--av-text-muted)]">{a.type === "BILLING" ? "Faktura" : "Leverans"} · </span>
                    {a.line1}, {a.postalCode} {a.city}
                  </li>
                ))}
              </ul>
            )}
            <form action={addAddressAction} className="mt-5 space-y-3">
              <label className="block text-sm">
                Typ
                <select name="type" className="mt-1 h-11 w-full rounded-xl border border-[var(--av-border-strong)] px-3">
                  <option value="SHIPPING">Leverans</option>
                  <option value="BILLING">Faktura</option>
                </select>
              </label>
              <label className="block text-sm">
                Adress
                <input required name="line1" className="mt-1 h-11 w-full rounded-xl border border-[var(--av-border-strong)] px-3" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  Postnr
                  <input required name="postalCode" className="mt-1 h-11 w-full rounded-xl border border-[var(--av-border-strong)] px-3" />
                </label>
                <label className="block text-sm">
                  Ort
                  <input required name="city" className="mt-1 h-11 w-full rounded-xl border border-[var(--av-border-strong)] px-3" />
                </label>
              </div>
              <Button type="submit" className="w-full">
                Spara adress
              </Button>
            </form>
          </Panel>
        </>
      )}
    </div>
  );
}
