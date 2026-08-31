import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { getCustomerMaster } from "@/server/services/customer.service";
import { orderValue } from "@/server/services/order.service";
import { updateCustomerAction } from "@/actions/opsMasters";
import { LEAD_STATUS_LABELS, ORDER_STEP_LABELS } from "@/domain/enums";
import { priceListDisplayName } from "@/domain/priceLists";
import { Button, DataRow, DataTable, EmptyState, FileLink, LinkButton, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";

const FIELD = "h-11 w-full rounded-[var(--av-radius-md)] border border-[var(--av-border-strong)] bg-[var(--av-surface)] px-4 text-sm text-[var(--av-text)]";

const ADDRESS_TYPE_LABELS: Record<string, string> = {
  BILLING: "Faktura",
  SHIPPING: "Leverans",
  FACTORY: "Fabrik",
  HQ: "Huvudkontor",
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  NOT_READY: "Inte redo",
  READY: "Redo",
  ISSUED: "Utfärdad",
  PARTIALLY_PAID: "Delvis betald",
  PAID: "Betald",
};

export default async function CustomerCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [customer, priceLists] = await Promise.all([
    getCustomerMaster(id),
    prisma.priceList.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!customer) notFound();

  const buyerKind = customer.reseller ? "ÅF" : "Direktkund";
  const priceListName = priceListDisplayName(customer.priceList?.name ?? customer.reseller?.priceList.name);
  const nextLead = customer.leads.find((l) => l.status === "ACTIVE" || l.status === "UPCOMING");

  const addressMap = new Map<string, { type: string; line1: string; postalCode: string; city: string }>();
  for (const a of [...customer.addresses, ...(customer.company?.addresses ?? []), ...(customer.reseller?.company.addresses ?? [])]) {
    addressMap.set(`${a.type}|${a.line1}|${a.postalCode}|${a.city}`, a);
  }
  for (const o of customer.orders) {
    const a = o.shippingAddress;
    addressMap.set(`${a.type}|${a.line1}|${a.postalCode}|${a.city}`, a);
  }
  const addresses = [...addressMap.values()];
  const billing = addresses.find((a) => a.type === "BILLING");
  const contactSeen = new Set<string>();
  const contacts = [
    ...customer.users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: "Kund" })),
    ...(customer.reseller?.users ?? []).map((u) => ({ id: u.id, name: u.name, email: u.email, role: "ÅF" })),
  ].filter((c) => {
    if (contactSeen.has(c.email)) return false;
    contactSeen.add(c.email);
    return true;
  });

  const qtyByYear = new Map<number, number>();
  for (const o of customer.orders) {
    const year = o.createdAt.getFullYear();
    qtyByYear.set(year, (qtyByYear.get(year) ?? 0) + o.items.reduce((s, i) => s + i.qty, 0));
  }
  const yearlyVolume = [...qtyByYear.entries()].sort((a, b) => a[0] - b[0]);

  const artwork = [
    ...customer.orders.flatMap((o) =>
      o.documents
        .filter((d) => d.kind === "ARTWORK" || d.kind === "PROOF" || d.kind === "PRODUCTION")
        .map((d) => ({ key: d.id, href: `/api/documents/${d.id}`, title: d.title, orderNo: o.orderNo })),
    ),
    ...customer.orders.flatMap((o) =>
      o.designs.flatMap((d) =>
        d.files.map((f) => ({
          key: f.id,
          href: `/api/artwork-files/${f.id}`,
          title: f.fileName,
          orderNo: o.orderNo,
        })),
      ),
    ),
    ...customer.orders.flatMap((o) =>
      o.artworkVersions.map((v) => ({
        key: v.id,
        href: null as string | null,
        title: v.title,
        orderNo: o.orderNo,
      })),
    ),
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={customer.name}
        subtitle={`${buyerKind}${customer.reseller ? ` · ${customer.reseller.company.name}` : ""} · ${priceListName}`}
        action={<LinkButton href="/operations/kunder" variant="secondary">Alla kunder</LinkButton>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Fakturauppgifter">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="av-label">Faktura-e-post</dt>
              <dd className="mt-1">{customer.email ?? customer.company?.email ?? customer.reseller?.company.email ?? "–"}</dd>
            </div>
            <div>
              <dt className="av-label">Fakturaadress</dt>
              <dd className="mt-1">
                {billing ? `${billing.line1}, ${billing.postalCode} ${billing.city}` : "Samma som leverans / enligt avtal"}
              </dd>
            </div>
          </dl>
        </Panel>
        <Panel title="Kontaktpersoner">
          {contacts.length === 0 ? (
            <p className="text-sm text-[var(--av-text-muted)]">Inga inloggade kontaktpersoner kopplade.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {contacts.map((c) => (
                <li key={c.id}>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-[var(--av-text-muted)]">
                    {c.role} · {c.email}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Kunduppgifter">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="av-label">Företag</dt>
              <dd className="mt-1 font-medium">{customer.company?.name ?? customer.name}</dd>
            </div>
            <div>
              <dt className="av-label">Org.nr</dt>
              <dd className="mt-1 font-mono">{customer.orgNr ?? customer.company?.orgNr ?? "–"}</dd>
            </div>
            <div>
              <dt className="av-label">E-post</dt>
              <dd className="mt-1">{customer.email ?? customer.company?.email ?? "–"}</dd>
            </div>
            <div>
              <dt className="av-label">Telefon</dt>
              <dd className="mt-1">{customer.phone ?? customer.company?.phone ?? "–"}</dd>
            </div>
            <div>
              <dt className="av-label">Prislista</dt>
              <dd className="mt-1">{priceListName}</dd>
            </div>
            <div>
              <dt className="av-label">Kundtyp</dt>
              <dd className="mt-1">{buyerKind}{customer.reseller ? ` · ${customer.reseller.company.name}` : ""}</dd>
            </div>
            <div>
              <dt className="av-label">Nästa lead</dt>
              <dd className="mt-1">
                {nextLead
                  ? `${nextLead.expectedAt.toLocaleDateString("sv-SE", { month: "long", year: "numeric" })} · ${nextLead.sourceOrder.orderNo}`
                  : "Ingen aktiv"}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel title="Leveransadresser">
          {addresses.length === 0 ? (
            <p className="text-sm text-[var(--av-text-muted)]">Inga adresser registrerade.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {addresses.map((a) => (
                <li key={`${a.type}-${a.line1}-${a.postalCode}`}>
                  <p className="av-label">
                    {ADDRESS_TYPE_LABELS[a.type] ?? a.type}
                  </p>
                  <p className="mt-1 font-medium">
                    {a.line1}, {a.postalCode} {a.city}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Redigera">
        <form action={updateCustomerAction} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={customer.id} />
          <label className="text-sm text-[var(--av-text-muted)]">
            Namn
            <input name="name" required defaultValue={customer.name} className={`${FIELD} mt-1`} />
          </label>
          <label className="text-sm text-[var(--av-text-muted)]">
            Org.nr
            <input name="orgNr" defaultValue={customer.orgNr ?? ""} className={`${FIELD} mt-1`} />
          </label>
          <label className="text-sm text-[var(--av-text-muted)]">
            E-post
            <input name="email" type="email" defaultValue={customer.email ?? ""} className={`${FIELD} mt-1`} />
          </label>
          <label className="text-sm text-[var(--av-text-muted)]">
            Telefon
            <input name="phone" type="tel" defaultValue={customer.phone ?? ""} className={`${FIELD} mt-1`} />
          </label>
          <label className="text-sm text-[var(--av-text-muted)] sm:col-span-2">
            Prislista
            <select name="priceListId" defaultValue={customer.priceListId ?? ""} className={`${FIELD} mt-1`}>
              <option value="">Ingen vald</option>
              {priceLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {priceListDisplayName(list.name)}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <Button type="submit">Spara kunduppgifter</Button>
          </div>
        </form>
      </Panel>

      <Panel title="Orderhistorik" padded={false}>
        {customer.orders.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Inga ordrar" body="När kunden beställer syns värde, datum och produkt här." />
          </div>
        ) : (
          <DataTable
            headers={[
              { label: "Order" },
              { label: "Datum" },
              { label: "Produkt" },
              { label: "Antal", align: "right" },
              { label: "Värde", align: "right" },
              { label: "Status" },
            ]}
          >
            {customer.orders.map((o) => {
              const item = o.items[0];
              return (
                <DataRow key={o.id} href={`/operations/ordrar/${o.orderNo}`}>
                  <td className="px-5 py-3">
                    <Link href={`/operations/ordrar/${o.orderNo}`} className="font-mono text-[var(--av-accent)]">
                      {o.orderNo}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{o.createdAt.toLocaleDateString("sv-SE")}</td>
                  <td className="px-5 py-3">{item?.variant.product.name ?? "–"}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{item?.qty ?? "–"}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{orderValue(o).toLocaleString("sv-SE")} kr</td>
                  <td className="px-5 py-3">
                    <StatusChip status={o.currentStatus} label={ORDER_STEP_LABELS[o.currentStatus]} />
                  </td>
                </DataRow>
              );
            })}
          </DataTable>
        )}
      </Panel>

      <Panel title="Fakturor" padded={false}>
        {customer.invoices.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Inga fakturor" body="Utfärdade fakturor för den här kunden syns här." />
          </div>
        ) : (
          <DataTable
            headers={[
              { label: "Faktura" },
              { label: "Order" },
              { label: "Datum" },
              { label: "Belopp", align: "right" },
              { label: "Status" },
            ]}
          >
            {customer.invoices.map((inv) => (
              <DataRow key={inv.id} href={`/operations/ekonomi/${inv.order.orderNo}/fakturera`}>
                <td className="px-5 py-3 font-mono">
                  <Link href={`/operations/ekonomi/${inv.order.orderNo}/fakturera`} className="text-[var(--av-accent)]">
                    {inv.invoiceNo}
                  </Link>
                  {inv.fortnoxId ? <p className="text-[12px] text-[var(--av-text-muted)]">{inv.fortnoxId}</p> : null}
                </td>
                <td className="px-5 py-3 font-mono">{inv.order.orderNo}</td>
                <td className="px-5 py-3">{inv.issuedAt?.toLocaleDateString("sv-SE") ?? "–"}</td>
                <td className="px-5 py-3 text-right tabular-nums">{inv.amountExVat.toLocaleString("sv-SE")} kr</td>
                <td className="px-5 py-3">
                  <StatusChip status={inv.status} label={INVOICE_STATUS_LABELS[inv.status] ?? inv.status} />
                </td>
              </DataRow>
            ))}
          </DataTable>
        )}
      </Panel>

      <Panel title="Repeat-mönster">
        {yearlyVolume.length === 0 ? (
          <p className="text-sm text-[var(--av-text-muted)]">Ingen orderhistorik ännu.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {yearlyVolume.map(([year, qty]) => (
              <li key={year}>
                {year} – {qty.toLocaleString("sv-SE")} muggar
              </li>
            ))}
            <li className="pt-2 font-medium">
              Nästa potentiella repeat:{" "}
              {nextLead
                ? nextLead.expectedAt.toLocaleDateString("sv-SE", { month: "long", year: "numeric" })
                : "Ingen planerad"}
            </li>
          </ul>
        )}
      </Panel>

      <Panel title="Återbeställningshistorik">
        {customer.leads.length === 0 ? (
          <p className="text-sm text-[var(--av-text-muted)]">Ingen återbeställning registrerad ännu.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {customer.leads.map((lead) => (
              <li key={lead.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {lead.expectedAt.toLocaleDateString("sv-SE", { month: "long", year: "numeric" })}
                    {" · "}
                    <Link href={`/operations/ordrar/${lead.sourceOrder.orderNo}`} className="font-mono text-[var(--av-accent)]">
                      {lead.sourceOrder.orderNo}
                    </Link>
                  </p>
                  {lead === nextLead ? (
                    <p className="mt-0.5 text-[12px] text-[var(--av-accent)]">Nästa återbeställning</p>
                  ) : null}
                </div>
                <StatusChip status={lead.status} label={LEAD_STATUS_LABELS[lead.status] ?? lead.status} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Tryckfiler och dokument">
        {artwork.length === 0 ? (
          <p className="text-sm text-[var(--av-text-muted)]">Inga tidigare tryckfiler eller dokument.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {artwork.map((a) => (
              <li key={a.key}>
                {a.href ? (
                  <FileLink href={a.href}>
                    {a.title} · {a.orderNo}
                  </FileLink>
                ) : (
                  <span>
                    {a.title} · {a.orderNo}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
