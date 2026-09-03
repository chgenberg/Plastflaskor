import { notFound, redirect } from "next/navigation";
import { getSessionUser, homeForRole } from "@/server/rbac";
import { getPublicWaterVariant } from "@/server/services/catalog.service";
import { isAquaAdmin } from "@/domain/policies/roles";
import { parseBottleOptions } from "@/domain/bottleCatalog";
import { OrderModal } from "@/ui/checkout/OrderModal";
import { PublicPage } from "@/ui/public/PageIntro";
import { LinkButton } from "@/ui/shell/primitives";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string; qty?: string; waterType?: string; cap?: string; color?: string }>;
}) {
  const sp = await searchParams;
  const user = await getSessionUser();
  if (user && (user.role === "LABEL" || user.role === "BOTTLER" || user.role === "FACTORY" || user.role === "RESELLER")) {
    redirect(homeForRole(user.role));
  }
  if (user && isAquaAdmin(user.role)) {
    return (
      <PublicPage narrow>
        <p className="text-sm text-[var(--av-text-secondary)]">Admin beställer inte i kassan.</p>
        <LinkButton href="/operations/ordrar/ny" className="mt-4">
          Skapa order i Master Dashboard
        </LinkButton>
      </PublicPage>
    );
  }

  const variant = await getPublicWaterVariant(sp.variant);
  if (!variant) notFound();

  const qty = Math.max(Number(sp.qty) || 0, variant.product.moq);
  const parsed = parseBottleOptions(variant.optionsJson);
  const selection = {
    productId: variant.productId,
    variantId: variant.id,
    qty,
    options: {
      waterType: (sp.waterType === "kolsyrat" || sp.waterType === "stilla" ? sp.waterType : parsed.waterType) as "stilla" | "kolsyrat",
      cap: sp.cap || parsed.cap,
      color: sp.color || parsed.color,
    },
  };

  return (
    <PublicPage narrow>
      <OrderModal
        embedded
        selection={selection}
        me={user?.email ? { email: user.email, customerId: user.customerId ?? null } : null}
      />
    </PublicPage>
  );
}
