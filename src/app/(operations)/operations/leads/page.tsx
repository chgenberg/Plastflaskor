import Link from "next/link";
import { activateDueLeads, leadMatchesBucket, listLeads, type LeadBucket } from "@/server/services/lead.service";
import { orderValue } from "@/server/services/order.service";
import { remindLeadAction, updateLeadAction } from "@/actions";
import { LEAD_STATUS_LABELS } from "@/domain/enums";
import { Button, DashList, DashRow, EmptyState, FilterChip, LinkButton, PageHeader, StatusChip } from "@/ui/shell/primitives";

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
          return (
            <FilterChip
              key={`filter-${b.id}`}
              href={b.id === "all" ? "/operations/leads" : `/operations/leads?bucket=${b.id}`}
              active={bucket === b.id}
            >
              {b.label}
              <span className="ml-1.5 tabular-nums">{count}</span>
            </FilterChip>
          );
        })}
      </div>
      {visible.length === 0 ? (
        <EmptyState title="Inga leads" body={bucket === "all" ? "När förväntad återbeställning sätts på en order syns de här." : "Inget i den här bunten just nu."} />
      ) : (
        <DashList>
          {visible.map((lead) => {
            const item = lead.sourceOrder.items[0];
            const value = orderValue(lead.sourceOrder);
            return (
              <DashRow
                key={lead.id}
                primary={lead.customer.name}
                primaryHref={`/operations/ordrar/${lead.sourceOrder.orderNo}`}
                columns={[
                  lead.expectedAt.toLocaleDateString("sv-SE", { month: "short", year: "numeric" }),
                  lead.sourceOrder.orderNo,
                  item ? `${item.variant.product.name} · ${item.qty.toLocaleString("sv-SE")} st` : "–",
                  `${value.toLocaleString("sv-SE")} kr`,
                ]}
                status={<StatusChip status={lead.status} label={LEAD_STATUS_LABELS[lead.status] ?? lead.status} />}
                actions={
                  <>
                    <LinkButton href={`/operations/ordrar/${lead.sourceOrder.orderNo}`} variant="secondary" size="sm">
                      Öppna
                    </LinkButton>
                    <LinkButton href={`/operations/ordrar/${lead.sourceOrder.orderNo}/repeat?lead=${lead.id}`} size="sm">
                      Skapa repeat
                    </LinkButton>
                    <form action={remindLeadAction}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <Button type="submit" variant="secondary" size="sm">
                        Påminn
                      </Button>
                    </form>
                    <form action={updateLeadAction}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <input type="hidden" name="status" value="SNOOZED" />
                      <Button type="submit" variant="secondary" size="sm">
                        Skjut upp
                      </Button>
                    </form>
                  </>
                }
              />
            );
          })}
        </DashList>
      )}
    </div>
  );
}
