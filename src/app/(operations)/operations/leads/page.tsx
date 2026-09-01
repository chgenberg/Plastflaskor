import { activateDueLeads, leadMatchesBucket, listLeads, type LeadBucket } from "@/server/services/lead.service";
import { orderValue } from "@/server/services/order.service";
import { remindLeadAction, updateLeadAction } from "@/actions";
import { LEAD_STATUS_LABELS } from "@/domain/enums";
import { Button, DashTable, EmptyState, FilterChip, LinkButton, PageHeader, StatusChip, TableActions } from "@/ui/shell/primitives";

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
    <div className="space-y-4">
      <PageHeader title="Leads" subtitle="Aktiva repeat-möjligheter en månad före förväntad order." />
      <div className="flex flex-wrap gap-1.5">
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
        <DashTable
          count={`${visible.length} lead${visible.length === 1 ? "" : "s"}`}
          columns={[
            { label: "Kund" },
            { label: "Förväntad" },
            { label: "Order" },
            { label: "Innehåll" },
            { label: "Värde", align: "right" },
            { label: "Status" },
            { label: "Åtgärd", sr: true },
          ]}
        >
          {visible.map((lead) => {
            const item = lead.sourceOrder.items[0];
            const value = orderValue(lead.sourceOrder);
            return (
              <tr key={lead.id}>
                <td className="font-medium">{lead.customer.name}</td>
                <td className="whitespace-nowrap text-[var(--av-text-secondary)]">
                  {lead.expectedAt.toLocaleDateString("sv-SE", { month: "short", year: "numeric" })}
                </td>
                <td>{lead.sourceOrder.orderNo}</td>
                <td>{item ? `${item.variant.product.name} · ${item.qty.toLocaleString("sv-SE")} st` : "–"}</td>
                <td className="av-num font-semibold">{value.toLocaleString("sv-SE")} kr</td>
                <td>
                  <StatusChip status={lead.status} label={LEAD_STATUS_LABELS[lead.status] ?? lead.status} />
                </td>
                <td className="av-actions">
                  <TableActions>
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
                  </TableActions>
                </td>
              </tr>
            );
          })}
        </DashTable>
      )}
    </div>
  );
}
