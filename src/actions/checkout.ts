"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { signIn, signOut } from "@/server/auth";
import { getSessionUser, homeForRole } from "@/server/rbac";
import { getIntegrations } from "@/server/integrations/composition";
import { rateLimit } from "@/server/rateLimit";
import { createSelfServeCustomer, findCompanyByOrgNr, findUserByEmail } from "@/server/services/customer.service";
import {
  assertCanSeePrices,
  getPriceListForBuyer,
  resolveUnitPrice,
} from "@/server/services/catalog.service";
import { createBuyerOrder, findRecentDuplicateOrder } from "@/server/services/order.service";
import { checkoutOrderSchema, checkoutRegisterSchema } from "@/domain/schemas/checkout";
import { normalizeOrgNr } from "@/domain/orgNr";
import { uploadArtworkForOrder } from "@/server/services/artwork.service";

export type CheckoutState = {
  ok: boolean;
  existing?: boolean;
  error?: string;
  code?: "EMAIL_TAKEN" | "ORG_TAKEN" | "NOT_A_CUSTOMER" | "NO_PRICE";
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
};

function flatten(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const out: Record<string, string> = {};
  const fields = error.flatten().fieldErrors;
  for (const [k, v] of Object.entries(fields)) {
    if (v?.[0]) out[k] = v[0];
  }
  return out;
}

async function clientIp() {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  } catch {
    return "unknown";
  }
}

export async function lookupCompanyAction(orgNr: string) {
  const ip = await clientIp();
  if (!rateLimit(`lookup:${ip}`, 20, 10 * 60 * 1000).ok) {
    return { ok: false as const, error: "För många sökningar. Försök igen om en stund." };
  }
  const digits = normalizeOrgNr(orgNr);
  if (digits.length !== 10) return { ok: true as const, hit: null };
  const hit = await getIntegrations().companyLookup.lookup(digits);
  return { ok: true as const, hit };
}

export async function previewPriceAction(input: { variantId: string; qty: number }) {
  const user = await getSessionUser();
  assertCanSeePrices(user?.role);
  if (!user?.customerId) return null;
  const list = await getPriceListForBuyer({ customerId: user.customerId, variantId: input.variantId });
  const hit = resolveUnitPrice(list?.items ?? [], input.variantId, input.qty);
  if (!hit) return null;
  return {
    unitPriceExVat: hit.unitPriceExVat,
    lineExVat: Math.round(hit.unitPriceExVat * input.qty * 100) / 100,
  };
}

async function signInCustomer(email: string, password: string): Promise<CheckoutState> {
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    return { ok: false, code: "EMAIL_TAKEN", error: "Kontot finns. Logga in med ditt vanliga lösenord." };
  }
  const user = await getSessionUser();
  if (user?.role !== "CUSTOMER" || !user.customerId) {
    await signOut({ redirect: false });
    return { ok: false, code: "NOT_A_CUSTOMER", error: "Det här kontot kan inte beställa." };
  }
  return { ok: true, existing: true };
}

export async function registerCheckoutAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const ip = await clientIp();
  if (!rateLimit(`register:${ip}`, 5, 10 * 60 * 1000).ok) {
    return { ok: false, error: "För många försök. Vänta några minuter." };
  }
  const parsed = checkoutRegisterSchema.safeParse({
    company: String(formData.get("company") ?? ""),
    orgNr: String(formData.get("orgNr") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
    login: String(formData.get("login") ?? "") === "on",
    clientToken: String(formData.get("clientToken") ?? ""),
    variantId: String(formData.get("variantId") || "") || undefined,
    qty: formData.get("qty") ? Number(formData.get("qty")) : undefined,
  });
  if (!parsed.success) return { ok: false, fieldErrors: flatten(parsed.error) };

  const existing = await findUserByEmail(parsed.data.email);
  if (existing || parsed.data.login) {
    return signInCustomer(parsed.data.email, parsed.data.password);
  }

  const company = await findCompanyByOrgNr(parsed.data.orgNr);
  if (company) {
    return {
      ok: false,
      code: "ORG_TAKEN",
      error: company.users.length
        ? "Företaget har redan ett konto. Logga in eller be en kollega bjuda in dig."
        : "Företaget finns redan. Kontakta oss så kopplar vi ett konto.",
    };
  }

  try {
    await createSelfServeCustomer(parsed.data);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return signInCustomer(parsed.data.email, parsed.data.password);
    }
    return { ok: false, error: err instanceof Error ? err.message : "Kunde inte skapa kontot." };
  }

  const signed = await signInCustomer(parsed.data.email, parsed.data.password);
  if (!signed.ok) return signed;
  return { ok: true };
}

export async function placeCheckoutOrderAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await getSessionUser();
  if (user && user.role !== "CUSTOMER") {
    redirect(homeForRole(user.role));
  }
  if (user?.role !== "CUSTOMER" || !user.customerId) {
    return { ok: false, error: "Sessionen saknas. Skapa konto igen." };
  }

  const parsed = checkoutOrderSchema.safeParse({
    variantId: String(formData.get("variantId") ?? ""),
    qty: Number(formData.get("qty")),
    requestedDate: String(formData.get("requestedDate") || "") || undefined,
    waterType: String(formData.get("waterType") || "") || undefined,
    cap: String(formData.get("cap") || "") || undefined,
    color: String(formData.get("color") || "") || undefined,
    designId: String(formData.get("designId") || "") || undefined,
    line1: String(formData.get("line1") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    city: String(formData.get("city") ?? ""),
    invoiceRef: String(formData.get("invoiceRef") ?? ""),
    acceptTerms: String(formData.get("acceptTerms") ?? ""),
    clientToken: String(formData.get("clientToken") ?? ""),
  });
  if (!parsed.success) return { ok: false, fieldErrors: flatten(parsed.error) };

  let order;
  try {
    const dup = await findRecentDuplicateOrder({
      customerId: user.customerId,
      variantId: parsed.data.variantId,
      qty: parsed.data.qty,
      clientToken: parsed.data.clientToken,
    });
    order =
      dup ??
      (await createBuyerOrder({
        variantId: parsed.data.variantId,
        qty: parsed.data.qty,
        requestedDate: parsed.data.requestedDate,
        waterType: parsed.data.waterType,
        cap: parsed.data.cap,
        color: parsed.data.color,
        designId: parsed.data.designId,
        line1: parsed.data.line1,
        postalCode: parsed.data.postalCode,
        city: parsed.data.city,
        invoiceRef: parsed.data.invoiceRef,
        buyerType: "CUSTOMER",
        customerId: user.customerId,
        actorRole: "CUSTOMER",
        source: "checkout",
        clientToken: parsed.data.clientToken,
      }));
    if (!dup) {
      const artwork = formData.get("artwork");
      const file = artwork instanceof File && artwork.size > 0 ? artwork : null;
      if (file) {
        await uploadArtworkForOrder({
          orderId: order.id,
          userId: user.id,
          role: user.role,
          customerId: user.customerId,
          fileName: file.name,
          mimeType: file.type,
          bytes: Buffer.from(await file.arrayBuffer()),
        });
      }
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002" && parsed.data.clientToken) {
      const again = await findRecentDuplicateOrder({
        customerId: user.customerId,
        variantId: parsed.data.variantId,
        qty: parsed.data.qty,
        clientToken: parsed.data.clientToken,
      });
      if (again) redirect(`/kassa/bekraftelse?order=${again.orderNo}`);
    }
    const message = err instanceof Error ? err.message : "Kunde inte lägga ordern.";
    if (message === "Kontakta oss för pris") {
      return { ok: false, code: "NO_PRICE", redirectTo: "/offert", error: message };
    }
    return { ok: false, error: message };
  }
  redirect(`/kassa/bekraftelse?order=${order.orderNo}`);
}
