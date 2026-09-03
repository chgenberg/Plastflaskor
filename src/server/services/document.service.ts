import { readFile } from "fs/promises";
import path from "path";
import { isAquaAdmin } from "@/domain/policies/roles";
import { prisma } from "../db";
import { renderSimplePdf } from "../pdf/simplePdf";
import type { DocumentKind } from "@prisma/client";
import { getLocalFile, putLocalFile } from "../storage/local";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export function uploadPath(storageKey: string) {
  return path.join(UPLOAD_ROOT, storageKey);
}

export async function readUploadedBytes(storageKey: string) {
  const fromStore = await getLocalFile(storageKey);
  if (fromStore) return fromStore;
  try {
    return await readFile(uploadPath(storageKey));
  } catch {
    return null;
  }
}

export async function saveUploadedDocument(input: {
  orderId: string;
  title: string;
  kind: DocumentKind;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}) {
  const previous = await prisma.document.findFirst({
    where: { orderId: input.orderId, title: input.title },
    orderBy: { version: "desc" },
  });
  const version = (previous?.version ?? 0) + 1;
  const safe = input.fileName.replace(/[^\wåäöÅÄÖ.-]+/g, "_");
  const storageKey = `orders/${input.orderId}/${Date.now()}-v${version}-${safe}`;
  await putLocalFile(storageKey, input.bytes);
  return prisma.document.create({
    data: {
      orderId: input.orderId,
      entityType: "ORDER",
      entityId: input.orderId,
      kind: input.kind,
      title: input.title,
      storageKey,
      version,
    },
  });
}

const FACTORY_DOC_KINDS = ["PRODUCTION", "LOGISTICS", "ARTWORK", "WAYBILL"] as const;

type SessionLike = {
  id: string;
  role: string;
  resellerId?: string | null;
  factoryId?: string | null;
  customerId?: string | null;
};

export async function getAuthorizedDocument(id: string, user: SessionLike) {
  const factoryRole = user.role === "FACTORY" || user.role === "LABEL" || user.role === "BOTTLER";
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          customer: true,
          ...(factoryRole ? {} : { invoice: true }),
        },
      },
    },
  });
  if (!doc) return null;
  if (user.role === "CUSTOMER") {
    if (!user.customerId || doc.order?.customerId !== user.customerId) return null;
    return doc;
  }
  if (user.role === "RESELLER") return null;
  if (user.role === "FACTORY" || user.role === "LABEL" || user.role === "BOTTLER") {
    if (!(FACTORY_DOC_KINDS as readonly string[]).includes(doc.kind)) return null;
    if (user.role === "LABEL" && doc.entityType === "BOTTLER_INVOICE") return null;
    if (!user.factoryId) return null;
    if (doc.order?.factoryId !== user.factoryId) {
      const job = await prisma.productionJob.findFirst({
        where: { orderId: doc.orderId ?? undefined, factoryId: user.factoryId },
      });
      if (!job) return null;
    }
    return doc;
  }
  if (isAquaAdmin(user.role)) return doc;
  return null;
}

export async function getAuthorizedArtworkFile(id: string, user: SessionLike) {
  const file = await prisma.artworkFile.findUnique({
    where: { id },
    include: { design: { include: { order: true } } },
  });
  if (!file) return null;
  if (user.role === "CUSTOMER") {
    const ownUser = file.design.userId === user.id;
    const ownOrder = Boolean(user.customerId && file.design.order?.customerId === user.customerId);
    if (!ownUser && !ownOrder) return null;
    return file;
  }
  if (user.role === "RESELLER") return null;
  if (user.role === "FACTORY" || user.role === "LABEL" || user.role === "BOTTLER") {
    if (!file.design.orderId) return null;
    if (!user.factoryId) return null;
    if (user.factoryId && file.design.order && file.design.order.factoryId !== user.factoryId) {
      const job = await prisma.productionJob.findFirst({
        where: { orderId: file.design.orderId, factoryId: user.factoryId },
      });
      if (!job) return null;
    }
    const final = await prisma.artworkVersion.findFirst({
      where: { orderId: file.design.orderId, storageKey: file.storageKey, isFinal: true },
    });
    if (!final) return null;
    return file;
  }
  if (isAquaAdmin(user.role)) return file;
  return null;
}

export function documentPdf(doc: {
  title: string;
  kind: string;
  storageKey: string;
  version: number;
  order?: {
    orderNo: string;
    customer?: { name: string; email?: string | null };
    invoice?: {
      invoiceNo: string;
      status: string;
      amountExVat: number;
      vatAmount: number;
      amountIncVat: number;
    } | null;
  } | null;
}) {
  const inv = doc.order?.invoice;
  const finance = doc.kind === "FINANCE" && inv;
  return renderSimplePdf(doc.title, [
    finance ? "Aqua Visibility AB  ·  Fortnox mock" : `Typ: ${doc.kind}`,
    finance ? "V1-faktura via mockad Fortnox. Ingen live-bokföring." : `Version: ${doc.version}`,
    doc.order?.orderNo ? `Order: ${doc.order.orderNo}` : "",
    doc.order?.customer?.name ? `Kund: ${doc.order.customer.name}` : "",
    doc.order?.customer?.email ? `E-post: ${doc.order.customer.email}` : "",
    finance ? `Fakturanr: ${inv.invoiceNo}` : `Nyckel: ${doc.storageKey}`,
    finance ? `Status: ${inv.status === "PAID" ? "Betald" : inv.status === "ISSUED" ? "Skickad" : inv.status}` : "",
    finance ? `Summa ex moms: ${inv.amountExVat.toFixed(2)} kr` : "",
    finance ? `Moms 25%: ${inv.vatAmount.toFixed(2)} kr` : "",
    finance ? `Att betala: ${inv.amountIncVat.toFixed(2)} kr` : "",
    "",
    finance
      ? "Fakturan är skapad mot Fortnox-mocken."
      : "Detta är en genererad kopia. Originalfilen finns hos Aqua Visibility.",
  ].filter(Boolean));
}

export function artworkFilePdf(file: { fileName: string; kind: string; storageKey: string; design: { projectName: string } }) {
  return renderSimplePdf(file.fileName, [
    `Design: ${file.design.projectName}`,
    `Typ: ${file.kind}`,
    `Nyckel: ${file.storageKey}`,
    "",
    "Detta är en genererad kopia av artwork-filen.",
  ]);
}

export async function getOrderRecord(orderId: string) {
  return prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
}

export async function getBuyerDesign(designId: string, user: { id: string; role: string }) {
  return prisma.design.findFirst({
    where: {
      id: designId,
      ...(user.role === "CUSTOMER" ? { userId: user.id } : {}),
    },
  });
}

export async function listDesignsForUser(user: SessionLike) {
  if (user.role === "CUSTOMER") {
    return prisma.design.findMany({
      where: {
        OR: [{ userId: user.id }, ...(user.customerId ? [{ order: { customerId: user.customerId } }] : [])],
      },
      include: { files: true, order: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
  }
  if (user.role === "RESELLER") return [];
  return prisma.design.findMany({
    include: { files: true, order: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}

export async function getLatestStudioDraft(user: SessionLike) {
  if (user.role === "RESELLER") return null;
  const draft = { orderId: null, status: "DRAFT" as const };
  const where =
    user.role === "CUSTOMER"
      ? {
          ...draft,
          OR: [{ userId: user.id }, ...(user.customerId ? [{ order: { customerId: user.customerId } }] : [])],
        }
      : { ...draft, userId: user.id };
  return prisma.design.findFirst({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      projectName: true,
      productId: true,
      canvasJson: true,
      optionsJson: true,
      cupDocumentJson: true,
    },
  });
}
