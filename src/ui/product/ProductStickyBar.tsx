export function ProductStickyBar({ name, volume }: { name: string; volume: string | null }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--av-border)] bg-[var(--av-surface)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          {volume ? <p className="text-[12px] text-[var(--av-text-muted)]">{volume}</p> : null}
        </div>
        <a
          href="#bestall"
          className="inline-flex h-10 shrink-0 items-center rounded-[var(--av-radius-md)] bg-[var(--av-ink)] px-4 text-sm font-medium text-[var(--av-surface)]"
        >
          Beställ
        </a>
      </div>
    </div>
  );
}
