import { prisma } from "../db";

function blank(value?: string) {
  const t = value?.trim();
  return t ? t : undefined;
}

export async function listCustomers(q?: string) {
  const term = blank(q);
  return prisma.customer.findMany({
    where: term
      ? {
          OR: [
            { name: { contains: term } },
            { orgNr: { contains: term } },
            { email: { contains: term } },
            { reseller: { company: { name: { contains: term } } } },
          ],
        }
      : undefined,
    include: {
      reseller: { include: { company: true, priceList: true } },
      orders: { select: { id: true, currentStatus: true, createdAt: true } },
      leads: { where: { status: { in: ["ACTIVE", "UPCOMING"] } }, orderBy: { expectedAt: "asc" } },
      priceList: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function createDirectCustomer(input: {
  name: string;
  orgNr?: string;
  email?: string;
  phone?: string;
  priceListId?: string;
  line1?: string;
  postalCode?: string;
  city?: string;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Namn krävs");
  const line1 = blank(input.line1);
  const postalCode = blank(input.postalCode);
  const city = blank(input.city);
  const hasAddress = Boolean(line1 && postalCode && city);
  return prisma.customer.create({
    data: {
      name,
      orgNr: blank(input.orgNr),
      email: blank(input.email),
      phone: blank(input.phone),
      priceListId: blank(input.priceListId) ?? null,
      resellerId: null,
      addresses: hasAddress
        ? {
            create: {
              type: "SHIPPING",
              line1: line1!,
              postalCode: postalCode!,
              city: city!,
            },
          }
        : undefined,
    },
  });
}

export async function updateCustomer(
  id: string,
  input: { name: string; orgNr?: string; email?: string; phone?: string; priceListId?: string },
) {
  const name = input.name.trim();
  if (!name) throw new Error("Namn krävs");
  return prisma.customer.update({
    where: { id },
    data: {
      name,
      orgNr: blank(input.orgNr) ?? null,
      email: blank(input.email) ?? null,
      phone: blank(input.phone) ?? null,
      priceListId: blank(input.priceListId) ?? null,
    },
  });
}

export async function getCustomerMaster(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      reseller: { include: { company: { include: { addresses: true } }, priceList: true, users: { select: { id: true, name: true, email: true, role: true } } } },
      company: { include: { addresses: true } },
      users: { select: { id: true, name: true, email: true, role: true } },
      priceList: true,
      addresses: true,
      invoices: {
        include: { order: { select: { orderNo: true } } },
        orderBy: { issuedAt: "desc" },
      },
      leads: {
        include: { sourceOrder: { select: { orderNo: true } } },
        orderBy: { expectedAt: "asc" },
      },
      orders: {
        include: {
          items: { include: { variant: { include: { product: true } } } },
          shippingAddress: true,
          documents: true,
          designs: { include: { files: true } },
          artworkVersions: true,
          invoice: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
