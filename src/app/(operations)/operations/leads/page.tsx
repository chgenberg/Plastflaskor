import Link from "next/link";
import { activateDueLeads, leadMatchesBucket, listLeads, type LeadBucket } from "@/server/services/lead.service";
import { orderValue } from "@/server/services/order.service";
import { remindLeadAction, updateLeadAction } from "@/actions";
import { LEAD_STATUS_LABELS } from "@/domain/enums";
import { Button, EmptyState, FileLink, LinkButton, PageHeader, Panel, StatusChip } from "@/ui/shell/primitives";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { specFromOrderItem } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";

const BUCKETS: { id: LeadBucket | "all"; label: string; key: keyof Awaited<ReturnType<typeof listLeads>>["buckets"] | null }[] = [
  { id: "all", label: "Alla", key: null },
  { id: "week", label: "Denna vecka", key: "week" },
  { id: "month", label: "Nästa 30 dagar", key: "month" },
  { id: "reminded", label: "Påmind", key: "reminded" },
  { id: "converted", label: "Ny order skapad", key: "converted" },
  { id: "snoozed", label: "Uppskjutna", key: "snoozed" },
];

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ bucket?: string }> }) {
  await activateDueLeads();
  const { bucket: raw } = await searchParams;
  const bucket = BUCKETS.some((b) => b.id === raw) ? (raw as LeadBucket | "all") : "all";
  const { leads, buckets } = await listLeads();
  const visible = bucket === "all" ? leads : leads.filter((l) => leadMatchesBucket(l, bucket));

  return (
    <div className="space-y-8">
      <PageHeader title="Leads" subtitle="Aktiva repeat-möjligheter en månad före förväntad order." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {BUCKETS.filter((b) => b.id !== "all").map((b) => {
          const count = b.key ? buckets[b.key] : 0;
          return (
            <Link
              key={b.id}
              href={`/operations/leads?bucket=${b.id}`}
              className="av-card p-5 hover:border-[var(--av-border-strong)]"
            >
              <p className="av-label">{b.id === "reminded" ? "Kund påmind – ej svar" : b.id === "week" ? "Aktuella denna vecka" : b.id === "month" ? "Nästa 30 dagar" : b.id === "converted" ? "Repeat skapad" : "Uppskjutna"}</p>
              <p className="mt-2 text-[28px] font-semibold tabular-nums">{count}</p>
            </Link>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {BUCKETS.map((b) => {
          const count = b.key ? buckets[b.key] : leads.length;
          const active = bucket === b.id;
          return (
            <Link
              key={`filter-${b.id}`}
              href={b.id === "all" ? "/operations/leads" : `/operations/leads?bucket=${b.id}`}
              className={`inline-flex items-center gap-2 rounded-[var(--av-radius-md)] px-3 py-1.5 text-sm ${
                active ? "bg-[var(--av-accent-soft)] font-medium text-[var(--av-accent)]" : "bg-[var(--av-surface)] text-[var(--av-text-muted)] shadow-[var(--av-shadow-sm)]"
              }`}
            >
              {b.label}
              <span className="tabular-nums">{count}</span>
            </Link>
          );
        })}
      </div>
      {visible.length === 0 ? (
        <EmptyState title="Inga leads" body={bucket === "all" ? "När förväntad återbeställning sätts på en order syns de här." : "Inget i den här bunten just nu."} />
      ) : (
        <div className="grid gap-4">
          {visible.map((lead) => {
            const item = lead.sourceOrder.items[0];
            const spec = specFromOrderItem({
              visualSpecJson: lead.sourceOrder.visualSpecJson,
              item,
              imageSrc: item ? imageForProduct(item.variant.product.slug) : null,
            });
            const value = orderValue(lead.sourceOrder);
            const email = lead.customer.email;
            const artworkDocs = lead.sourceOrder.documents.filter((d) => d.kind === "ARTWORK" || d.kind === "PROOF");
            return (
              <Panel key={lead.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="av-label">Företag</p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight">{lead.customer.name}</h2>
                  </div>
                  <StatusChip status={lead.status} label={LEAD_STATUS_LABELS[lead.status] ?? lead.status} />
                </div>
                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="av-label">Förväntad månad</dt>
                    <dd className="mt-1 font-medium capitalize">
                      {lead.expectedAt.toLocaleDateString("sv-SE", { month: "long", year: "numeric" })}
                    </dd>
                  </div>
                  <div>
                    <dt className="av-label">Föregående order</dt>
                    <dd className="mt-1 font-mono">{lead.sourceOrder.orderNo}</dd>
                  </div>
                  <div>
                    <dt className="av-label">Produkt</dt>
                    <dd className="mt-1 font-medium">{item?.variant.product.name ?? "–"}</dd>
                  </div>
                  <div>
                    <dt className="av-label">Variant</dt>
                    <dd className="mt-1">{item?.variant.name ?? "–"}</dd>
                  </div>
                  <div>
                    <dt className="av-label">Antal</dt>
                    <dd className="mt-1 tabular-nums">{item?.qty?.toLocaleString("sv-SE") ?? "–"}</dd>
                  </div>
                  <div>
                    <dt className="av-label">Föregående värde</dt>
                    <dd className="mt-1 tabular-nums">{value.toLocaleString("sv-SE")} kr</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="av-label">Kontakt</dt>
                    <dd className="mt-1">{email ?? "–"}</dd>
                  </div>
                </dl>
                {spec ? (
                  <div className="mt-5">
                    <VisualSpecCard spec={spec} compact />
                  </div>
                ) : null}
                {artworkDocs.length > 0 ? (
                  <ul className="mt-4 space-y-1 text-sm">
                    {artworkDocs.map((d) => (
                      <li key={d.id}>
                        <FileLink href={`/api/documents/${d.id}`}>{d.title}</FileLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-2">
                  <LinkButton href={`/operations/ordrar/${lead.sourceOrder.orderNo}/repeat?lead=${lead.id}`}>
                    Skapa repeat
                  </LinkButton>
                  <LinkButton href={`/operations/ordrar/${lead.sourceOrder.orderNo}`} variant="secondary">
                    Öppna tidigare order
                  </LinkButton>
                  <form action={remindLeadAction}>
                    <input type="hidden" name="leadId" value={lead.id} />
                    <Button type="submit" variant="secondary">
                      Påminn kund
                    </Button>
                  </form>
                  <form action={updateLeadAction}>
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input type="hidden" name="status" value="CONTACTED" />
                    <Button type="submit" variant="secondary">
                      Kontakta kund
                    </Button>
                  </form>
                  <form action={updateLeadAction}>
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input type="hidden" name="status" value="SNOOZED" />
                    <Button type="submit" variant="secondary">
                      Skjut upp
                    </Button>
                  </form>
                  <form action={updateLeadAction}>
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input type="hidden" name="status" value="NOT_RELEVANT" />
                    <Button type="submit" variant="secondary">
                      Ej aktuell
                    </Button>
                  </form>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
