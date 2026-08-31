export function IntegrationBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--av-accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--av-accent)]">
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
        <span className="text-[12px] tabular-nums text-[var(--av-text-muted)]">
          Faktura {invoiceNo}
          {fortnoxId ? ` · ${fortnoxId}` : ""}
        </span>
      ) : null}
    </div>
  );
}
