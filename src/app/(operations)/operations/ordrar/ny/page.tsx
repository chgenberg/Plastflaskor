import { requireRole } from "@/server/rbac";
import { parseBottleOptions } from "@/domain/bottleCatalog";
import { priceListDisplayName } from "@/domain/priceLists";
import { getPriceListForBuyer, getPriceListPreview, listPriceLists, listWaterProducts } from "@/server/services/catalog.service";
import { listCustomerAddresses, listCustomers } from "@/server/services/customer.service";
import { ManualOrderCustomerPicker, ManualOrderForm } from "@/ui/order/ManualOrderForm";
import { DashPage, EmptyState, PageHeader, Panel } from "@/ui/shell/primitives";

export default async function NewManualOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ kund?: string; lista?: string }>;
}) {
  await requireRole(["AQUA_STAFF", "AQUA_ADMIN"]);
  const { kund, lista } = await searchParams;
  const isNewCustomer = kund === "ny";
  const customerId = kund && kund !== "ny" ? kund : undefined;

  const [customers, products, priceLists] = await Promise.all([
    listCustomers(),
    listWaterProducts(),
    listPriceLists(),
  ]);

  const customer = customerId ? customers.find((c) => c.id === customerId) : null;
  const addresses = customerId
    ? (await listCustomerAddresses(customerId)).map((a) => ({ id: a.id, line1: a.line1, city: a.city }))
    : [];

  const list = customerId
    ? await getPriceListForBuyer({ customerId })
    : isNewCustomer
      ? await getPriceListPreview(lista)
      : null;

  const variants = list
    ? products.flatMap((p) =>
        p.variants.map((v) => {
          const opt = parseBottleOptions(v.optionsJson);
          return {
            id: v.id,
            name: v.name,
            productId: p.id,
            productName: p.name,
            moq: p.moq,
            volumeMl: v.volumeMl,
            waterType: opt.waterType,
            cap: opt.cap ?? "skruvkork",
            color: opt.color ?? "transparent",
            leadTimeDays: p.leadTimeDays,
            tiers: list.items
              .filter((i) => i.variantId === v.id)
              .map((i) => ({ minQty: i.minQty, unitPriceExVat: i.unitPriceExVat })),
          };
        }),
      )
    : [];

  const picker = (
    <ManualOrderCustomerPicker
      customers={customers.map((c) => ({ id: c.id, name: c.name, orgNr: c.orgNr }))}
      selected={kund ?? ""}
    />
  );

  return (
    <DashPage>
      <PageHeader
        title="Ny order"
        subtitle="Registrera en inköpsorder som kommit via mejl. Priset tas från kundens prislista — listor blandas inte."
      />
      <Panel>{picker}</Panel>
      {customerId && !customer ? (
        <EmptyState title="Kund saknas" body="Välj en kund i listan eller skapa ny från mejlet." />
      ) : !kund ? (
        <EmptyState title="Välj kund" body="Befintlig kund, eller ny kund om företaget inte finns i registret ännu." />
      ) : (
        <Panel
          title={
            customer
              ? `${customer.name}${customer.orgNr ? ` · ${customer.orgNr}` : ""} · ${priceListDisplayName(customer.priceList?.name)}`
              : `Ny kund · förhandsvisning ${priceListDisplayName(list?.name)}`
          }
        >
          <ManualOrderForm
            variants={variants}
            addresses={addresses}
            customerId={customer?.id}
            isNewCustomer={isNewCustomer}
            priceLists={priceLists.map((p) => ({ id: p.id, name: p.name }))}
            selectedPriceListId={lista}
          />
        </Panel>
      )}
    </DashPage>
  );
}
