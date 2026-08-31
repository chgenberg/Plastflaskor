import Image from "next/image";
import { listCupProducts } from "@/server/services/catalog.service";
import { togglePrintRequirementAction } from "@/actions";
import { updateProductAction } from "@/actions/catalogMasters";
import { CUP_PRINT_REQUIREMENTS } from "@/domain/enums";
import { Button, PageHeader, Panel } from "@/ui/shell/primitives";
import { VisualSpecCard } from "@/ui/order/VisualSpecCard";
import { visualSpecFromOptions } from "@/domain/visualSpec";
import { imageForProduct } from "@/domain/productImages";

export default async function ProductsAdmin() {
  const products = await listCupProducts();
  return (
    <div className="space-y-8">
      <PageHeader title="Produkter" subtitle="Pappmuggar i orderflödet. Publik Woo-katalog är oförändrad." />
      <div className="grid gap-5">
        {products.map((p) => {
          const v = p.variants[0];
          const imageSrc = imageForProduct(p.slug);
          const spec = visualSpecFromOptions({
            productName: p.name,
            qty: p.moq,
            volumeMl: v?.volumeMl,
            optionsJson: v?.optionsJson,
            imageSrc,
          });
          const requirements = p.printRequirements.length ? p.printRequirements : CUP_PRINT_REQUIREMENTS;
          return (
            <Panel key={p.id} title={p.name}>
              <div className="grid gap-6 lg:grid-cols-[160px_1fr]">
                {imageSrc ? (
                  <div className="relative mx-auto h-44 w-36 overflow-hidden rounded-[var(--av-radius-lg)] bg-[var(--av-bg)]">
                    <Image src={imageSrc} alt={p.name} fill className="object-contain p-3" sizes="144px" />
                  </div>
                ) : (
                  <div className="flex h-44 items-center justify-center rounded-[var(--av-radius-lg)] bg-[var(--av-bg)] text-sm text-[var(--av-text-muted)]">
                    Ingen bild
                  </div>
                )}
                <div>
                  <VisualSpecCard spec={spec} compact />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[var(--av-accent-soft)] px-3 py-1 text-[12px] font-medium text-[var(--av-accent)]">
                      Minsta order {p.moq.toLocaleString("sv-SE")}
                    </span>
                    <span className="rounded-full bg-[var(--av-bg)] px-3 py-1 text-[12px] font-medium text-[var(--av-text)]">
                      {p.leadTimeText}
                    </span>
                    <span className="rounded-full bg-[var(--av-bg)] px-3 py-1 text-[12px] font-medium text-[var(--av-text)]">
                      {(p.printFormat ?? "Wrap") === "Wrap" ? "Tryckyta runt mugg" : p.printFormat}
                    </span>
                  </div>
                  {p.oneLiner ? <p className="mt-3 text-sm text-[var(--av-text-muted)]">{p.oneLiner}</p> : null}
                  <form action={updateProductAction} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <input type="hidden" name="id" value={p.id} />
                    <label className="text-sm">
                      Minsta order
                      <input
                        name="moq"
                        type="number"
                        min={1}
                        required
                        defaultValue={p.moq}
                        className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2"
                      />
                    </label>
                    <label className="text-sm">
                      Ledtid (dagar)
                      <input
                        name="leadTimeDays"
                        type="number"
                        min={1}
                        required
                        defaultValue={p.leadTimeDays}
                        className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2"
                      />
                    </label>
                    <label className="text-sm">
                      Ledtid (text)
                      <input
                        name="leadTimeText"
                        type="text"
                        required
                        defaultValue={p.leadTimeText}
                        className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2"
                      />
                    </label>
                    <label className="text-sm">
                      Tryckformat
                      <input
                        name="printFormat"
                        type="text"
                        defaultValue={p.printFormat ?? "Wrap"}
                        className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2"
                      />
                    </label>
                    <label className="text-sm sm:col-span-2">
                      Kort beskrivning
                      <input
                        name="oneLiner"
                        type="text"
                        defaultValue={p.oneLiner}
                        className="mt-1 w-full rounded-xl border border-[var(--av-border-strong)] px-3 py-2"
                      />
                    </label>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <Button type="submit" variant="secondary">
                        Spara produkt
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
              <div className="mt-6">
                <p className="av-label">Tryckkrav</p>
                <ul className="mt-3 space-y-2">
                  {requirements.map((r) => (
                    <li
                      key={r.code}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--av-bg)] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{r.label}</p>
                        <p className="text-[12px] text-[var(--av-text-muted)]">{r.required ? "Obligatoriskt" : "Valfritt"}</p>
                      </div>
                      {"id" in r ? (
                        <form action={togglePrintRequirementAction}>
                          <input type="hidden" name="requirementId" value={r.id} />
                          <input type="hidden" name="required" value={r.required ? "false" : "true"} />
                          <Button type="submit" variant="secondary">
                            {r.required ? "Gör valfri" : "Gör obligatorisk"}
                          </Button>
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
