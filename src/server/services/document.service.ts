import { prisma } from "../db";
import { renderSimplePdf } from "../pdf/simplePdf";

const FACTORY_DOC_KINDS = ["PRODUCTION", "LOGISTICS", "ARTWORK", "WAYBILL"] as const;

type SessionLike = {
  id: string;
  role: string;
  resellerId?: string | null;
  factoryId?: string | null;
};

export async function getAuthorizedDocument(id: string, user: SessionLike) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { order: { include: { customer: true, reseller: { include: { company: true } } } } },
  });
  if (!doc) return null;
  if (user.role === "RESELLER") {
    if (!user.resellerId || doc.order?.resellerId !== user.resellerId) return null;
    return doc;
  }
  if (user.role === "FACTORY") {
    if (!(FACTORY_DOC_KINDS as readonly string[]).includes(doc.kind)) return null;
    if (user.factoryId && doc.order?.factoryId !== user.factoryId) return null;
    return doc;
  }
  if (user.role === "AQUA_STAFF" || user.role === "AQUA_ADMIN") return doc;
  return null;
}

export async function getAuthorizedArtworkFile(id: string, user: SessionLike) {
  const file = await prisma.artworkFile.findUnique({
    where: { id },
    include: { design: { include: { order: true } } },
  });
  if (!file) return null;
  if (user.role === "RESELLER") {
    const ownUser = file.design.userId === user.id;
    const ownOrder = Boolean(user.resellerId && file.design.order?.resellerId === user.resellerId);
    if (!ownUser && !ownOrder) return null;
    return file;
  }
  if (user.role === "FACTORY") {
    if (user.factoryId && file.design.order && file.design.order.factoryId !== user.factoryId) return null;
    if (!file.design.orderId) return null;
    return file;
  }
  if (user.role === "AQUA_STAFF" || user.role === "AQUA_ADMIN") return file;
  return null;
}

export function documentPdf(doc: {
  title: string;
  kind: string;
  storageKey: string;
  version: number;
  order?: { orderNo: string; customer?: { name: string }; reseller?: { company?: { name: string } } } | null;
}) {
  return renderSimplePdf(doc.title, [
    `Typ: ${doc.kind}`,
    `Version: ${doc.version}`,
    doc.order?.orderNo ? `Order: ${doc.order.orderNo}` : "",
    doc.order?.customer?.name ? `Kund: ${doc.order.customer.name}` : "",
    doc.order?.reseller?.company?.name ? `ÅF: ${doc.order.reseller.company.name}` : "",
    `Nyckel: ${doc.storageKey}`,
    "",
    "Detta är en genererad kopia. Originalfilen finns hos Aqua Visibility.",
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

export async function listDesignsForUser(user: SessionLike) {
  if (user.role === "RESELLER") {
    return prisma.design.findMany({
      where: {
        OR: [{ userId: user.id }, ...(user.resellerId ? [{ order: { resellerId: user.resellerId } }] : [])],
      },
      include: { files: true, order: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
  }
  return prisma.design.findMany({
    include: { files: true, order: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}
