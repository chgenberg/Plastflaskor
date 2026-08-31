"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/server/auth";
import { getSessionUser, homeForRole } from "@/server/rbac";
import {
  createQuote,
  repeatOrder,
  advanceOrder,
  getOrderByNo,
  createResellerOrderFromDesign,
  createCustomerOrderFromDesign,
  createBuyerOrder,
  saveExtras,
  sendOrderConfirmation,
} from "@/server/services/order.service";
import { approveArtwork, confirmDelivery, customerApproveProof, uploadArtworkForOrder } from "@/server/services/artwork.service";
import { addressSchema, buyerOrderSchema, extraLineSchema, quoteSchema, repeatSchema } from "@/domain/schemas";
import { FACTORY_EVENTS, factoryAdvance, approveFactoryDate, setFactoryDeadline } from "@/server/services/production.service";
import { markLeadConverted, remindLead, updateLead } from "@/server/services/lead.service";
import { setPrintRequirementRequired } from "@/server/services/catalog.service";
import { getIntegrations } from "@/server/integrations/composition";
import { prisma } from "@/server/db";
import { OrderStatus, RepeatLeadStatus } from "@prisma/client";
import { safeInternalPath } from "@/domain/safePath";
import type { ExtraLine } from "@/domain/extras";
import { assertRequiredPrintPlaced, emptyCupDocument, parseCupDocument, type CupDocument } from "@/domain/cupDocument";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "");
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    redirect("/login?error=invalid");
  }
  const user = await getSessionUser();
  const role =
    user?.role ??
    (await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { role: true },
    }))?.role;
  redirect(safeInternalPath(nextRaw, homeForRole(role)));
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
    qty: Number(formData.get("qty") ?? 500),
    designId: String(formData.get("designId") || "") || undefined,
  });
  if (!parsed.success) redirect("/offert?error=1");
  const order = await createQuote(parsed.data);
  redirect(`/offert/tack?order=${order.orderNo}`);
}

export async function placeBuyerOrderAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Logga in");
  const parsed = buyerOrderSchema.safeParse({
    variantId: String(formData.get("variantId") ?? ""),
    qty: Number(formData.get("qty")),
    addressId: String(formData.get("addressId") || "") || undefined,
    line1: String(formData.get("line1") || "") || undefined,
    postalCode: String(formData.get("postalCode") || "") || undefined,
    city: String(formData.get("city") || "") || undefined,
    invoiceRef: String(formData.get("invoiceRef") || "") || undefined,
    requestedDate: String(formData.get("requestedDate") || "") || undefined,
    deliveryRequirement: String(formData.get("deliveryRequirement") || "") || undefined,
    notes: String(formData.get("notes") || "") || undefined,
    lid: String(formData.get("lid") || "none"),
    finish: String(formData.get("finish") || "matte"),
    designId: String(formData.get("designId") || "") || undefined,
    customerId: String(formData.get("customerId") || "") || undefined,
  });
  if (!parsed.success) throw new Error("Ogiltig order");

  const artwork = formData.get("artwork");
  const file = artwork instanceof File && artwork.size > 0 ? artwork : null;

  if (user.role === "CUSTOMER") {
    if (!user.customerId) throw new Error("Kundkonto saknas");
    const order = await createBuyerOrder({
      ...parsed.data,
      buyerType: "CUSTOMER",
      customerId: user.customerId,
      actorRole: "CUSTOMER",
    });
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
    redirect(`/konto/ordrar/${order.orderNo}`);
  }
  if (user.role === "RESELLER") {
    if (!user.resellerId) throw new Error("ÅF saknas");
    const reseller = await prisma.reseller.findUnique({
      where: { id: user.resellerId },
      include: { customers: true },
    });
    const customerId = parsed.data.customerId ?? reseller?.customers[0]?.id;
    if (!customerId) throw new Error("Välj kund");
    if (!reseller?.customers.some((c) => c.id === customerId)) throw new Error("Forbidden");
    const order = await createBuyerOrder({
      ...parsed.data,
      buyerType: "RESELLER",
      resellerId: user.resellerId,
      customerId,
      actorRole: "RESELLER",
    });
    if (file) {
      await uploadArtworkForOrder({
        orderId: order.id,
        userId: user.id,
        role: user.role,
        resellerId: user.resellerId,
        customerId,
        fileName: file.name,
        mimeType: file.type,
        bytes: Buffer.from(await file.arrayBuffer()),
      });
    }
    redirect(`/partner/ordrar/${order.orderNo}`);
  }
  throw new Error("Forbidden");
}

export async function repeatOrderAction(formData: FormData) {
  const user = await getSessionUser();
  const parsed = repeatSchema.safeParse({
    sourceOrderId: String(formData.get("sourceOrderId")),
    qty: Number(formData.get("qty")),
    requestedDate: String(formData.get("requestedDate") || "") || undefined,
    addressId: String(formData.get("addressId") || "") || undefined,
    notes: String(formData.get("notes") || "") || undefined,
    invoiceRef: String(formData.get("invoiceRef") || ""),
  });
  if (!parsed.success) throw new Error("Ogiltig repeat-order");
  const source = await prisma.order.findUnique({ where: { id: parsed.data.sourceOrderId } });
  if (!source) throw new Error("Order saknas");
  const staff = user?.role === "AQUA_STAFF" || user?.role === "AQUA_ADMIN";
  if (user?.role === "RESELLER" && source.resellerId !== user.resellerId) throw new Error("Forbidden");
  if (user?.role === "CUSTOMER" && source.customerId !== user.customerId) throw new Error("Forbidden");
  const order = await repeatOrder({
    ...parsed.data,
    actorRole: (user?.role as "RESELLER" | "CUSTOMER" | "AQUA_STAFF") ?? "RESELLER",
    resellerId: user?.role === "RESELLER" ? user.resellerId : staff ? source.resellerId : null,
    customerId: user?.role === "CUSTOMER" ? user.customerId : source.customerId,
  });
  const leadId = String(formData.get("leadId") || "");
  if (leadId) await markLeadConverted(leadId, order.id);
  redirect(user?.role === "CUSTOMER" ? `/konto/ordrar/${order.orderNo}` : `/partner/ordrar/${order.orderNo}`);
}

export async function opsAdvanceAction(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "AQUA_STAFF" && user?.role !== "AQUA_ADMIN") throw new Error("Forbidden");
  const orderNo = String(formData.get("orderNo"));
  const toStatus = String(formData.get("toStatus")) as OrderStatus;
  const order = await getOrderByNo(orderNo);
  if (!order) throw new Error("Order saknas");
  await advanceOrder(order.id, toStatus, user.role as "AQUA_STAFF", "ops");
  revalidatePath(`/operations/ordrar/${orderNo}`);
  revalidatePath("/operations");
}

export async function saveExtrasAction(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "AQUA_STAFF" && user?.role !== "AQUA_ADMIN") throw new Error("Forbidden");
  const orderNo = String(formData.get("orderNo"));
  const order = await getOrderByNo(orderNo);
  if (!order) throw new Error("Order saknas");
  const extras: ExtraLine[] = [];
  for (const kind of ["freight", "express", "setup", "special", "discount", "other"] as const) {
    const amount = Number(formData.get(`extra_${kind}`) || 0);
    if (amount) {
      const parsed = extraLineSchema.safeParse({
        kind,
        label: String(formData.get(`label_${kind}`) || kind),
        amountExVat: amount,
      });
      if (parsed.success) extras.push(parsed.data);
    }
  }
  await saveExtras(order.id, extras);
  revalidatePath(`/operations/ordrar/${orderNo}`);
}

export async function sendObAction(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "AQUA_STAFF" && user?.role !== "AQUA_ADMIN") throw new Error("Forbidden");
  const orderNo = String(formData.get("orderNo"));
  const order = await getOrderByNo(orderNo);
  if (!order) throw new Error("Order saknas");
  const horizonRaw = String(formData.get("repeatHorizon") || "0");
  const months = Number(horizonRaw);
  await sendOrderConfirmation({
    orderId: order.id,
    confirmedDate: String(formData.get("confirmedDate") || order.preliminaryDate || ""),
    repeatHorizonMonths: months > 0 ? months : null,
    actorRole: user.role as "AQUA_STAFF",
  });
  revalidatePath(`/operations/ordrar/${orderNo}`);
  revalidatePath("/operations/leads");
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
  await factoryAdvance(
    jobId,
    job.factoryId,
    action as (typeof FACTORY_EVENTS)[number],
    user.role as "FACTORY" | "AQUA_STAFF" | "AQUA_ADMIN",
    {
      issueNote: String(formData.get("issueNote") || "") || undefined,
      readyDate: String(formData.get("readyDate") || "") || undefined,
    },
  );
  revalidatePath("/factory");
  revalidatePath(`/factory/jobb/${jobId}`);
}

export async function createWaybillAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user || (user.role !== "AQUA_STAFF" && user.role !== "AQUA_ADMIN")) throw new Error("Forbidden");
  const orderNo = String(formData.get("orderNo") || "");
  const jobId = String(formData.get("jobId") || "");
  const order = orderNo
    ? await getOrderByNo(orderNo)
    : (await prisma.productionJob.findUnique({ where: { id: jobId } }))
      ? await prisma.order.findFirst({ where: { jobs: { some: { id: jobId } } } })
      : null;
  const job = jobId
    ? await prisma.productionJob.findUnique({ where: { id: jobId } })
    : order
      ? await prisma.productionJob.findFirst({ where: { orderId: order.id } })
      : null;
  if (!order && !job) throw new Error("Order saknas");
  const oid = order?.id ?? job!.orderId;
  const result = await getIntegrations().shipment.createWaybill({
    orderId: oid,
    jobId: job?.id,
    packages: Number(formData.get("packages") ?? 1),
    weightKg: Number(formData.get("weightKg") ?? 20),
    carrier: String(formData.get("carrier") ?? "PostNord"),
  });
  if (job) {
    revalidatePath(`/factory/jobb/${job.id}`);
    redirect(`/factory/jobb/${job.id}/fraktsedel?tracking=${result.trackingNo}`);
  }
  revalidatePath(`/operations/ordrar/${orderNo}`);
}

function cupDocumentFromSave(input: {
  cupDocumentJson?: string;
  optionsJson: string;
  canvasJson: string;
  productSlug: string;
  quantity: number;
}): CupDocument {
  const parsed = parseCupDocument(input.cupDocumentJson);
  if (parsed) return { ...parsed, quantity: input.quantity, productSlug: input.productSlug };
  let options: Record<string, unknown> = {};
  let canvas: { layers?: CupDocument["layers"] } = {};
  try {
    options = JSON.parse(input.optionsJson || "{}") as Record<string, unknown>;
  } catch {
    options = {};
  }
  try {
    canvas = JSON.parse(input.canvasJson || "{}") as { layers?: CupDocument["layers"] };
  } catch {
    canvas = {};
  }
  const reqs = Array.isArray(options.requirements) ? (options.requirements as CupDocument["requirements"]) : [];
  return emptyCupDocument({
    productSlug: input.productSlug,
    quantity: input.quantity,
    wall: options.wall === "dubbel" ? "dubbel" : "enkel",
    eco: options.eco === true || options.eco === "ja",
    finish: options.finish === "glossy" ? "glossy" : "matte",
    lid: options.lid === "white" || options.lid === "black" ? options.lid : "none",
    layers: canvas.layers ?? [],
    requirements: reqs,
  });
}

export async function saveDesignAction(input: {
  productId: string;
  projectName: string;
  quantity: number;
  optionsJson: string;
  canvasJson: string;
  cupDocumentJson?: string;
  designId?: string;
}) {
  const user = await getSessionUser();
  const source = user?.role === "CUSTOMER" ? "customer_order" : user?.role === "RESELLER" ? "reseller_order" : "public_quote";
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new Error("Produkt saknas");
  const cupDoc = cupDocumentFromSave({
    cupDocumentJson: input.cupDocumentJson,
    optionsJson: input.optionsJson,
    canvasJson: input.canvasJson,
    productSlug: product.slug,
    quantity: input.quantity,
  });
  const cupDocumentJson = JSON.stringify(cupDoc);
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
        cupDocumentJson,
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
      cupDocumentJson,
      source,
      userId: user?.id,
      status: "DRAFT",
    },
  });
}

export async function attachDesignToOrderAction(designId: string) {
  const design = await prisma.design.findUnique({ where: { id: designId } });
  if (!design) throw new Error("Design saknas");
  const cupDoc = parseCupDocument(design.cupDocumentJson);
  if (cupDoc) {
    assertRequiredPrintPlaced(cupDoc.requirements);
  } else {
    const product = await prisma.product.findUnique({
      where: { id: design.productId },
      include: { printRequirements: true },
    });
    assertRequiredPrintPlaced(
      (product?.printRequirements ?? []).map((r) => ({ required: r.required, placed: false })),
    );
  }
  const user = await getSessionUser();
  if (user?.role === "CUSTOMER" && user.customerId) {
    return createCustomerOrderFromDesign({ designId, customerId: user.customerId });
  }
  if (!user?.resellerId) throw new Error("Logga in som ÅF eller kund");
  return createResellerOrderFromDesign({
    designId,
    resellerId: user.resellerId,
    userId: user.id,
  });
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

export async function customerApproveProofAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Forbidden");
  const orderNo = String(formData.get("orderNo"));
  const order = await getOrderByNo(orderNo);
  if (!order) throw new Error("Order saknas");
  if (user.role === "RESELLER" && order.resellerId !== user.resellerId) throw new Error("Forbidden");
  if (user.role === "CUSTOMER" && order.customerId !== user.customerId) throw new Error("Forbidden");
  await customerApproveProof(order.id, user.role as "CUSTOMER" | "RESELLER");
  revalidatePath(user.role === "CUSTOMER" ? `/konto/ordrar/${orderNo}` : `/partner/ordrar/${orderNo}`);
  revalidatePath("/konto");
  revalidatePath("/partner");
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

export async function approveFactoryDateAction(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "AQUA_STAFF" && user?.role !== "AQUA_ADMIN") throw new Error("Forbidden");
  const orderNo = String(formData.get("orderNo"));
  const date = String(formData.get("date"));
  const order = await getOrderByNo(orderNo);
  if (!order) throw new Error("Order saknas");
  await approveFactoryDate(order.id, date, user.role as "AQUA_STAFF");
  revalidatePath(`/operations/ordrar/${orderNo}`);
}

export async function updateLeadAction(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "AQUA_STAFF" && user?.role !== "AQUA_ADMIN") throw new Error("Forbidden");
  await updateLead(String(formData.get("leadId")), String(formData.get("status")) as RepeatLeadStatus, String(formData.get("note") || "") || undefined);
  revalidatePath("/operations/leads");
}

export async function remindLeadAction(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "AQUA_STAFF" && user?.role !== "AQUA_ADMIN") throw new Error("Forbidden");
  await remindLead(String(formData.get("leadId")));
  revalidatePath("/operations/leads");
}

export async function addAddressAction(formData: FormData) {
  const user = await getSessionUser();
  const parsed = addressSchema.parse({
    line1: String(formData.get("line1") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    city: String(formData.get("city") ?? ""),
    type: String(formData.get("type") || "SHIPPING"),
  });
  if (user?.role === "CUSTOMER" && user.customerId) {
    await prisma.address.create({
      data: { customerId: user.customerId, type: parsed.type, line1: parsed.line1, postalCode: parsed.postalCode, city: parsed.city },
    });
    revalidatePath("/konto");
    return;
  }
  if (!user?.resellerId) throw new Error("Endast inloggad köpare");
  const reseller = await prisma.reseller.findUnique({ where: { id: user.resellerId } });
  if (!reseller) throw new Error("Återförsäljare saknas");
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

export async function togglePrintRequirementAction(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "AQUA_STAFF" && user?.role !== "AQUA_ADMIN") throw new Error("Forbidden");
  const id = String(formData.get("requirementId") ?? "");
  const required = String(formData.get("required")) === "true";
  if (!id) throw new Error("Tryckkrav saknas");
  await setPrintRequirementRequired(id, required);
  revalidatePath("/operations/produkter");
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

export async function setFactoryDeadlineAction(formData: FormData) {
  const user = await getSessionUser();
  if (user?.role !== "AQUA_STAFF" && user?.role !== "AQUA_ADMIN") throw new Error("Forbidden");
  const orderNo = String(formData.get("orderNo"));
  const date = String(formData.get("date"));
  const order = await getOrderByNo(orderNo);
  if (!order) throw new Error("Order saknas");
  await setFactoryDeadline(order.id, date);
  revalidatePath(`/operations/ordrar/${orderNo}`);
}
