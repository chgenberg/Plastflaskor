"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/server/auth";
import { getSessionUser } from "@/server/rbac";
import { createQuote, repeatOrder, advanceOrder, getOrderByNo, createResellerOrderFromDesign } from "@/server/services/order.service";
import { approveArtwork, confirmDelivery } from "@/server/services/artwork.service";
import { addressSchema, quoteSchema, repeatSchema } from "@/domain/schemas";
import { LABEL_NEXT } from "@/domain/enums";
import { FACTORY_EVENTS, factoryAdvance } from "@/server/services/production.service";
import { getIntegrations } from "@/server/integrations/composition";
import { prisma } from "@/server/db";
import { OrderStatus } from "@prisma/client";
import { safeInternalPath } from "@/domain/safePath";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeInternalPath(String(formData.get("next") ?? ""), "/");
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    redirect("/login?error=invalid");
  }
  redirect(next);
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function quoteAction(formData: FormData) {
  const parsed = quoteSchema.safeParse({
    company: String(formData.get("company") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") || "") || undefined,
    city: String(formData.get("city") || "") || undefined,
    message: String(formData.get("message") || "") || undefined,
    productId: String(formData.get("productId") ?? ""),
    qty: Number(formData.get("qty") ?? 270),
    designId: String(formData.get("designId") || "") || undefined,
  });
  if (!parsed.success) redirect("/offert?error=1");
  const order = await createQuote(parsed.data);
  redirect(`/offert/tack?order=${order.orderNo}`);
}

export async function repeatOrderAction(formData: FormData) {
  const user = await getSessionUser();
  const parsed = repeatSchema.safeParse({
    sourceOrderId: String(formData.get("sourceOrderId")),
    qty: Number(formData.get("qty")),
    requestedDate: String(formData.get("requestedDate")),
    addressId: String(formData.get("addressId") || "") || undefined,
    sameArtwork: formData.get("sameArtwork") === "yes",
    invoiceRef: String(formData.get("invoiceRef") || ""),
  });
  if (!parsed.success) throw new Error("Ogiltig repeat-order");
  const source = await prisma.order.findUnique({ where: { id: parsed.data.sourceOrderId } });
  if (!source) throw new Error("Order saknas");
  const staff = user?.role === "AQUA_STAFF" || user?.role === "AQUA_ADMIN";
  if (user?.role === "RESELLER" && source.resellerId !== user.resellerId) throw new Error("Forbidden");
  const resellerId = user?.role === "RESELLER" ? user.resellerId : staff ? source.resellerId : null;
  if (!resellerId) throw new Error("Endast återförsäljare");
  const order = await repeatOrder({
    ...parsed.data,
    resellerId,
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

function canRunFactory(role?: string | null) {
  return role === "FACTORY" || role === "AQUA_STAFF" || role === "AQUA_ADMIN";
}

export async function factoryAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !canRunFactory(user.role)) throw new Error("Forbidden");
  const jobId = String(formData.get("jobId"));
  const action = String(formData.get("action"));
  if (!FACTORY_EVENTS.includes(action as (typeof FACTORY_EVENTS)[number])) throw new Error("Forbidden");
  const job = await prisma.productionJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Jobb saknas");
  if (user.role === "FACTORY" && job.factoryId !== user.factoryId) throw new Error("Forbidden");
  await factoryAdvance(jobId, job.factoryId, action as (typeof FACTORY_EVENTS)[number], user.role as "FACTORY" | "AQUA_STAFF" | "AQUA_ADMIN");
  revalidatePath("/factory");
  revalidatePath(`/factory/jobb/${jobId}`);
}

export async function createWaybillAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user || !canRunFactory(user.role)) throw new Error("Forbidden");
  const jobId = String(formData.get("jobId"));
  const job = await prisma.productionJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Jobb saknas");
  if (user.role === "FACTORY" && job.factoryId !== user.factoryId) throw new Error("Forbidden");
  const result = await getIntegrations().shipment.createWaybill({
    orderId: job.orderId,
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
    const existing = await prisma.design.findUnique({ where: { id: input.designId } });
    if (!existing) throw new Error("Design saknas");
    const staff = user?.role === "AQUA_STAFF" || user?.role === "AQUA_ADMIN";
    if (existing.userId && existing.userId !== user?.id && !staff) throw new Error("Forbidden");
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

export async function attachDesignToOrderAction(designId: string) {
  const user = await getSessionUser();
  if (!user?.resellerId) throw new Error("Endast återförsäljare");
  return createResellerOrderFromDesign({
    designId,
    resellerId: user.resellerId,
    userId: user.id,
  });
}

export async function labelAdvanceAction(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "AQUA_STAFF" && user?.role !== "AQUA_ADMIN") throw new Error("Forbidden");
  const labelId = String(formData.get("labelId"));
  const to = String(formData.get("to"));
  const allowed = Object.values(LABEL_NEXT)
    .map((n) => n?.to)
    .filter(Boolean);
  if (!allowed.includes(to)) throw new Error("Ogiltig etikettstatus");
  const label = await prisma.label.findUnique({ where: { id: labelId }, include: { order: true } });
  if (!label) throw new Error("Etikett saknas");
  if (to === "ORDERED") {
    await getIntegrations().label.orderLabels(label.orderId);
  } else {
    await prisma.label.update({
      where: { id: labelId },
      data: {
        status: to as "PRINTED" | "SHIPPED_TO_FACTORY" | "RECEIVED_BY_FACTORY",
        ...(to === "PRINTED" ? { printedAt: new Date() } : {}),
        ...(to === "SHIPPED_TO_FACTORY" ? { shippedAt: new Date() } : {}),
        ...(to === "RECEIVED_BY_FACTORY" ? { receivedAt: new Date() } : {}),
      },
    });
    const orderStatus =
      to === "PRINTED"
        ? "LABELS_PRINTED"
        : to === "SHIPPED_TO_FACTORY"
          ? "LABELS_SHIPPED_TO_FACTORY"
          : "LABELS_RECEIVED_BY_FACTORY";
    await advanceOrder(label.orderId, orderStatus, user.role as "AQUA_STAFF", "labels");
  }
  revalidatePath("/operations/etiketter");
  revalidatePath(`/operations/ordrar/${label.order.orderNo}`);
}

export async function approveArtworkAction(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "AQUA_STAFF" && user?.role !== "AQUA_ADMIN") throw new Error("Forbidden");
  const orderNo = String(formData.get("orderNo"));
  const order = await getOrderByNo(orderNo);
  if (!order) throw new Error("Order saknas");
  await approveArtwork(order.id, user.role as "AQUA_STAFF");
  revalidatePath(`/operations/ordrar/${orderNo}`);
  revalidatePath("/operations");
}

export async function confirmDeliveryAction(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "AQUA_STAFF" && user?.role !== "AQUA_ADMIN") throw new Error("Forbidden");
  const orderNo = String(formData.get("orderNo"));
  const order = await getOrderByNo(orderNo);
  if (!order) throw new Error("Order saknas");
  await confirmDelivery(order.id, user.role as "AQUA_STAFF");
  revalidatePath(`/operations/ordrar/${orderNo}`);
  revalidatePath("/operations");
  revalidatePath("/operations/ekonomi");
}

export async function addAddressAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user?.resellerId) throw new Error("Endast återförsäljare");
  const reseller = await prisma.reseller.findUnique({ where: { id: user.resellerId } });
  if (!reseller) throw new Error("Återförsäljare saknas");
  const parsed = addressSchema.parse({
    line1: String(formData.get("line1") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    city: String(formData.get("city") ?? ""),
    type: String(formData.get("type") || "SHIPPING"),
  });
  await prisma.address.create({
    data: {
      companyId: reseller.companyId,
      type: parsed.type,
      line1: parsed.line1,
      postalCode: parsed.postalCode,
      city: parsed.city,
    },
  });
  revalidatePath("/partner/konto");
}

export async function markNotificationRead(id: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Forbidden");
  const note = await prisma.notification.findUnique({ where: { id } });
  if (!note || note.userId !== user.id) throw new Error("Forbidden");
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
  if (inv) {
    const order = await prisma.order.findUnique({ where: { id: inv.orderId } });
    if (order) revalidatePath(`/operations/ekonomi/${order.orderNo}/fakturera`);
  }
}
