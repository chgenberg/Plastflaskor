"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/server/auth";
import { getSessionUser } from "@/server/rbac";
import { createQuote, repeatOrder, advanceOrder, getOrderByNo } from "@/server/services/order.service";
import { factoryAdvance } from "@/server/services/production.service";
import { getIntegrations } from "@/server/integrations/composition";
import { prisma } from "@/server/db";
import { OrderStatus } from "@prisma/client";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    redirect("/login?error=invalid");
  }
  redirect(next || "/");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function quoteAction(formData: FormData) {
  const order = await createQuote({
    company: String(formData.get("company") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    city: String(formData.get("city") ?? ""),
    message: String(formData.get("message") ?? ""),
    productId: String(formData.get("productId") ?? ""),
    qty: Number(formData.get("qty") ?? 270),
    designId: String(formData.get("designId") || "") || undefined,
  });
  redirect(`/offert/tack?order=${order.orderNo}`);
}

export async function repeatOrderAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user?.resellerId) throw new Error("Endast återförsäljare");
  const order = await repeatOrder({
    sourceOrderId: String(formData.get("sourceOrderId")),
    resellerId: user.resellerId,
    qty: Number(formData.get("qty")),
    requestedDate: String(formData.get("requestedDate")),
    addressId: String(formData.get("addressId") || "") || undefined,
    sameArtwork: formData.get("sameArtwork") === "yes",
    invoiceRef: String(formData.get("invoiceRef") || ""),
  });
  redirect(`/partner/ordrar/${order.orderNo}`);
}

export async function opsAdvanceAction(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "AQUA_STAFF" && user?.role !== "AQUA_ADMIN") throw new Error("Forbidden");
  const orderNo = String(formData.get("orderNo"));
  const toStatus = String(formData.get("toStatus")) as OrderStatus;
  const order = await getOrderByNo(orderNo);
  if (!order) throw new Error("Order saknas");
  if (toStatus === "LABELS_ORDERED") {
    await getIntegrations().label.orderLabels(order.id);
  } else {
    await advanceOrder(order.id, toStatus, user.role as "AQUA_STAFF", "ops");
  }
  revalidatePath(`/operations/ordrar/${orderNo}`);
  revalidatePath("/operations");
}

export async function invoiceAction(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "AQUA_STAFF" && user?.role !== "AQUA_ADMIN") throw new Error("Forbidden");
  const orderNo = String(formData.get("orderNo"));
  const order = await getOrderByNo(orderNo);
  if (!order) throw new Error("Order saknas");
  const result = await getIntegrations().fortnox.createInvoice(order.id);
  await getIntegrations().fortnox.sendInvoice(result.invoiceNo);
  revalidatePath(`/operations/ekonomi/${orderNo}/fakturera`);
  revalidatePath("/operations/ekonomi");
  redirect(`/operations/ekonomi/${orderNo}/fakturera?ok=1&invoice=${result.invoiceNo}`);
}

export async function factoryAction(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "FACTORY" || !user.factoryId) throw new Error("Forbidden");
  const jobId = String(formData.get("jobId"));
  const action = String(formData.get("action")) as Parameters<typeof factoryAdvance>[2];
  await factoryAdvance(jobId, user.factoryId, action);
  revalidatePath("/factory");
  revalidatePath(`/factory/jobb/${jobId}`);
}

export async function createWaybillAction(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "FACTORY" || !user.factoryId) throw new Error("Forbidden");
  const orderId = String(formData.get("orderId"));
  const jobId = String(formData.get("jobId"));
  const result = await getIntegrations().shipment.createWaybill({
    orderId,
    jobId,
    packages: Number(formData.get("packages") ?? 1),
    weightKg: Number(formData.get("weightKg") ?? 20),
    carrier: String(formData.get("carrier") ?? "PostNord"),
  });
  revalidatePath(`/factory/jobb/${jobId}`);
  redirect(`/factory/jobb/${jobId}/fraktsedel?tracking=${result.trackingNo}`);
}

export async function saveDesignAction(input: {
  productId: string;
  projectName: string;
  quantity: number;
  optionsJson: string;
  canvasJson: string;
  designId?: string;
}) {
  const user = await getSessionUser();
  if (input.designId) {
    return prisma.design.update({
      where: { id: input.designId },
      data: {
        projectName: input.projectName,
        quantity: input.quantity,
        optionsJson: input.optionsJson,
        canvasJson: input.canvasJson,
      },
    });
  }
  return prisma.design.create({
    data: {
      productId: input.productId,
      projectName: input.projectName,
      quantity: input.quantity,
      optionsJson: input.optionsJson,
      canvasJson: input.canvasJson,
      source: user?.role === "RESELLER" ? "reseller_order" : "public_quote",
      userId: user?.id,
      status: "DRAFT",
    },
  });
}

export async function markNotificationRead(id: string) {
  await getIntegrations().notifications.markRead(id);
  revalidatePath("/operations/notiser");
}

export async function aiGenerateAction(websiteUrl: string, productName: string) {
  return getIntegrations().designAI.generateProposals(websiteUrl, productName);
}

export async function aiRefineAction(message: string, current: { id: string; tone: "minimal" | "bold" | "event"; title: string; notes: string; canvas: { background: string; logoScale: number; qr: boolean } }) {
  return getIntegrations().designAI.refineProposal(message, current);
}

export async function markInvoicePaid(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "AQUA_ADMIN") throw new Error("Forbidden");
  const invoiceNo = String(formData.get("invoiceNo"));
  await prisma.invoice.update({
    where: { invoiceNo },
    data: { status: "PAID", paidAt: new Date() },
  });
  const inv = await prisma.invoice.findUnique({ where: { invoiceNo } });
  if (inv) await advanceOrder(inv.orderId, "PAID", "AQUA_ADMIN", "fortnox");
  revalidatePath("/operations/ekonomi");
}
