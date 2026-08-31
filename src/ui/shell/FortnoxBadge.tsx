export function IntegrationBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#E8EEFA] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B5BAA]">
      {label}
    </span>
  );
}

export function FortnoxBadge({
  label,
  invoiceNo,
  fortnoxId,
}: {
  label: string;
  invoiceNo?: string | null;
  fortnoxId?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <IntegrationBadge label={label} />
      {invoiceNo ? (
        <span className="text-[12px] tabular-nums text-[#6b7280]">
          Faktura {invoiceNo}
          {fortnoxId ? ` · ${fortnoxId}` : ""}
        </span>
      ) : null}
    </div>
  );
}
