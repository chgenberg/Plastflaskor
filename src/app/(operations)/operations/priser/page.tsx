import { updatePriceItemAction } from "@/actions/catalogMasters";
import { priceListDisplayName } from "@/domain/priceLists";
import { prisma } from "@/server/db";
import { Button, DataRow, DataTable, EmptyState, PageHeader } from "@/ui/shell/primitives";

export default async function PriceListsAdmin() {
  const lists = await prisma.priceList.findMany({
    include: {
      _count: { select: { items: true, resellers: true, customers: true } },
      items: {
        where: { variant: { product: { category: "PAPER_CUP" } } },
        select: {
          id: true,
          minQty: true,
          unitPriceExVat: true,
          variant: { select: { name: true, product: { select: { name: true } } } },
        },
        orderBy: [{ minQty: "asc" }, { unitPriceExVat: "asc" }],
      },
    },
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Prislistor" subtitle="Standard, Silver, Guld och Specialavtal. Ordern låser snapshot vid OB." />
      {lists.length === 0 ? (
        <EmptyState title="Inga prislistor" body="När listor seedas syns kod, ÅF, kunder och pappersmugg-rader här." />
      ) : (
        <div className="grid gap-5">
          {lists.map((list) => (
            <section key={list.id} className="overflow-hidden av-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--av-border)] px-5 py-4">
                <div>
                  <h2 className="text-[17px] font-semibold tracking-tight">
                    {priceListDisplayName(list.name)}
                  </h2>
                  <p className="mt-1 text-[12px] text-[var(--av-text-muted)]">{list.currency}</p>
                </div>
              </div>
              <div className="grid gap-3 border-b border-[var(--av-border)] px-5 py-4 sm:grid-cols-3">
                <div>
                  <p className="av-label">ÅF</p>
                  <p className="mt-1 text-[22px] font-semibold tabular-nums tracking-tight">{list._count.resellers}</p>
                </div>
                <div>
                  <p className="av-label">Slutkunder</p>
                  <p className="mt-1 text-[22px] font-semibold tabular-nums tracking-tight">{list._count.customers}</p>
                </div>
                <div>
                  <p className="av-label">Rader totalt</p>
                  <p className="mt-1 text-[22px] font-semibold tabular-nums tracking-tight">{list._count.items}</p>
                </div>
              </div>
              {list.items.length === 0 ? (
                <div className="p-5">
                  <p className="text-sm text-[var(--av-text-muted)]">Inga pappersmugg-rader på den här listan.</p>
                </div>
              ) : (
                <DataTable
                  headers={[
                    { label: "Pappmugg" },
                    { label: "Min antal", align: "right" },
                    { label: "Pris exkl. moms", align: "right" },
                    { label: "Spara" },
                  ]}
                >
                  {list.items.map((row, i) => {
                    const formId = `price-${row.id}`;
                    return (
                      <DataRow key={row.id} last={i === list.items.length - 1}>
                        <td className="px-5 py-2.5">
                          <form id={formId} action={updatePriceItemAction}>
                            <input type="hidden" name="id" value={row.id} />
                          </form>
                          <p className="font-medium">{row.variant.product.name}</p>
                          <p className="text-[12px] text-[var(--av-text-muted)]">{row.variant.name}</p>
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <input
                            form={formId}
                            name="minQty"
                            type="number"
                            min={1}
                            required
                            defaultValue={row.minQty}
                            className="ml-auto w-24 rounded-xl border border-[var(--av-border-strong)] px-3 py-2 text-right tabular-nums"
                          />
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <input
                            form={formId}
                            name="unitPriceExVat"
                            type="number"
                            min={0}
                            step="0.01"
                            required
                            defaultValue={row.unitPriceExVat.toFixed(2)}
                            className="ml-auto w-28 rounded-xl border border-[var(--av-border-strong)] px-3 py-2 text-right tabular-nums text-[var(--av-accent)]"
                          />
                        </td>
                        <td className="px-5 py-2.5">
                          <Button form={formId} type="submit" variant="secondary">
                            Spara
                          </Button>
                        </td>
                      </DataRow>
                    );
                  })}
                </DataTable>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
