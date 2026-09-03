import bcrypt from "bcryptjs";
import { prisma } from "../db";
import type { CheckoutRegisterInput } from "@/domain/schemas/checkout";

function blank(value?: string) {
  const t = value?.trim();
  return t ? t : undefined;
}

export async function getCustomerName(id: string) {
  const row = await prisma.customer.findUnique({ where: { id }, select: { name: true } });
  return row?.name ?? null;
}

export async function listCustomerAddresses(customerId: string) {
  return prisma.address.findMany({ where: { customerId } });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findCompanyByOrgNr(orgNr: string) {
  return prisma.company.findUnique({
    where: { orgNr },
    include: { users: { select: { id: true } } },
  });
}

export async function countUnverifiedCustomers() {
  return prisma.customer.count({ where: { verifiedAt: null } });
}

export async function verifyCustomer(customerId: string, priceListId: string, verifiedBy?: string) {
  const id = priceListId.trim();
  if (!id) throw new Error("Prislista krävs");
  const list = await prisma.priceList.findUnique({ where: { id } });
  if (!list) throw new Error("Prislista saknas");
  return prisma.customer.update({
    where: { id: customerId },
    data: { verifiedAt: new Date(), priceListId: list.id, verifiedBy: verifiedBy ?? null },
  });
}

export async function listCustomers(q?: string, filter?: "ny") {
  const term = blank(q);
  return prisma.customer.findMany({
    where: {
      AND: [
        filter === "ny" ? { verifiedAt: null } : {},
        term
          ? {
              OR: [
                { name: { contains: term } },
                { orgNr: { contains: term } },
                { email: { contains: term } },
              ],
            }
          : {},
      ],
    },
    include: {
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
      source: "staff",
      verifiedAt: new Date(),
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

export async function createSelfServeCustomer(input: CheckoutRegisterInput) {
  const standard = await prisma.priceList.findUniqueOrThrow({ where: { code: "STANDARD" } });
  const passwordHash = await bcrypt.hash(input.password, 10);
  return prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        orgNr: input.orgNr,
        name: input.company,
        email: input.email,
        phone: input.phone,
      },
    });
    const customer = await tx.customer.create({
      data: {
        name: input.company,
        orgNr: input.orgNr,
        email: input.email,
        phone: input.phone,
        companyId: company.id,
        priceListId: standard.id,
        resellerId: null,
        source: "self_signup",
        verifiedAt: null,
      },
    });
    const user = await tx.user.create({
      data: {
        email: input.email,
        name: input.contactName,
        passwordHash,
        role: "CUSTOMER",
        customerId: customer.id,
        companyId: company.id,
      },
    });
    return { customer, user, company };
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
