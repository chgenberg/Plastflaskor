import { createHmac, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../db";
import { resolveUnitPrice } from "./catalog.service";
import { renderSimplePdf } from "../pdf/simplePdf";

export class CheckoutError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

const TEST_PAN = "4242424242424242";

export function isStripeTestCard(pan: string) {
  return pan.replace(/\D/g, "") === TEST_PAN;
}

export function checkoutToken(orderNo: string) {
  const secret = process.env.AUTH_SECRET ?? "aquavisibility-os-demo-secret-change-in-prod";
  return createHmac("sha256", secret).update(`checkout:${orderNo}`).digest("hex").slice(0, 24);
}

export function assertCheckoutToken(orderNo: string, token: string) {
  if (!token || token !== checkoutToken(orderNo)) {
    throw new CheckoutError("Ogiltig bekräftelselänk.", 403);
  }
}

export async function previewCheckout(productId: string, qty: number, resellerId?: string | null) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  });
  if (!product?.isPublic) throw new CheckoutError("Produkten saknas.");
  const variant = product.variants[0];
  if (!variant) throw new CheckoutError("Produktvariant saknas.");
  const safeQty = Math.max(product.moq, Math.floor(qty) || product.moq);

  let items: { variantId: string; minQty: number; unitPriceExVat: number }[] = [];
  if (resellerId) {
    const reseller = await prisma.reseller.findUnique({
      where: { id: resellerId },
      include: { priceList: { include: { items: true } } },
    });
    items = reseller?.priceList.items ?? [];
  }
  if (!items.length) {
    const standard = await prisma.priceList.findUnique({
      where: { code: "STANDARD" },
      include: { items: true },
    });
    items = standard?.items ?? [];
  }
  const price = resolveUnitPrice(items, variant.id, safeQty);
  const unit = price?.unitPriceExVat ?? 18;
  const amountExVat = Math.round(unit * safeQty * 100) / 100;
  const vatAmount = Math.round(amountExVat * 0.25 * 100) / 100;
  return {
    product,
    variant,
    qty: safeQty,
    unitPriceExVat: unit,
    amountExVat,
    vatAmount,
    amountIncVat: Math.round((amountExVat + vatAmount) * 100) / 100,
    listName: resellerId ? "Din lista" : "Standard (demo)",
  };
}

function assertCard(pan: string, exp: string, cvc: string) {
  if (!isStripeTestCard(pan)) {
    throw new CheckoutError("Använd Stripe-testkortet 4242 4242 4242 4242. Ingen affär sker.");
  }
  const expOk = /^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(exp.trim());
  if (!expOk) throw new CheckoutError("Ogiltigt utgångsdatum. Använd MM/ÅÅ.");
  if (!/^\d{3,4}$/.test(cvc.trim())) throw new CheckoutError("Ogiltig CVC.");
}

export async function completeCheckout(input: {
  company: string;
  email: string;
  phone?: string;
  city: string;
  line1: string;
  postalCode: string;
  productId: string;
  qty: number;
  designId?: string;
  createAccount: boolean;
  password?: string;
  cardNumber: string;
  cardExp: string;
  cardCvc: string;
  existing?: { id: string; role: string; resellerId?: string | null; name?: string | null };
}) {
  const company = input.company.trim();
  const email = input.email.toLowerCase().trim();
  const city = input.city.trim();
  const line1 = input.line1.trim();
  const postalCode = input.postalCode.trim();
  if (!company || !email || !city || !line1 || !postalCode) {
    throw new CheckoutError("Fyll i företag, e-post och leveransadress.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new CheckoutError("Ogiltig e-post.");
  assertCard(input.cardNumber, input.cardExp, input.cardCvc);

  const wantAccount = input.createAccount === true;
  if (wantAccount && !input.existing?.resellerId) {
    if (!input.password || input.password.length < 8) {
      throw new CheckoutError("Kryssa i kontot och välj ett lösenord med minst 8 tecken.");
    }
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) {
      throw new CheckoutError("E-posten har redan ett konto. Logga in eller avmarkera rutan.");
    }
  }

  const preview = await previewCheckout(input.productId, input.qty, input.existing?.resellerId);
  if (input.designId) {
    const design = await prisma.design.findUnique({ where: { id: input.designId } });
    if (!design || design.productId !== input.productId) {
      throw new CheckoutError("Designen hör inte till den valda produkten.");
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    let resellerId = input.existing?.resellerId ?? null;
    let createdAccount = false;
    let createdUserId: string | undefined;

    if (resellerId) {
      createdUserId = input.existing?.id;
    } else if (wantAccount) {
      const orgNr = `55${String(Date.now()).slice(-8)}${randomBytes(1).toString("hex").slice(0, 2)}`;
      const code = `WEB-${randomBytes(3).toString("hex").toUpperCase()}`;
      const standard = await tx.priceList.findUnique({ where: { code: "STANDARD" } });
      if (!standard) throw new CheckoutError("Standardprislistan saknas.", 500);
      const co = await tx.company.create({
        data: { orgNr, name: company, email, phone: input.phone },
      });
      const reseller = await tx.reseller.create({
        data: { companyId: co.id, priceListId: standard.id, code },
      });
      const passwordHash = await bcrypt.hash(input.password!, 10);
      const created = await tx.user.create({
        data: {
          email,
          name: company,
          passwordHash,
          role: "RESELLER",
          companyId: co.id,
          resellerId: reseller.id,
        },
      });
      resellerId = reseller.id;
      createdUserId = created.id;
      createdAccount = true;
    } else {
      const lead = await tx.reseller.findFirst({ where: { code: "PUBLIC-LEAD" } });
      if (!lead) throw new CheckoutError("Publik lead-reseller saknas i seed.", 500);
      resellerId = lead.id;
    }

    const addr = await tx.address.create({
      data: {
        type: "SHIPPING",
        line1,
        postalCode,
        city,
        country: "SE",
      },
    });
    const customer = await tx.customer.create({
      data: {
        resellerId,
        name: company,
        email,
        phone: input.phone,
      },
    });
    const count = await tx.order.count();
    const orderNo = `AV-${10500 + count}`;
    const order = await tx.order.create({
      data: {
        orderNo,
        resellerId,
        customerId: customer.id,
        currentStatus: input.designId ? "ARTWORK_UPLOADED" : "ORDER_RECEIVED",
        shippingAddressId: addr.id,
        source: createdAccount || input.existing?.resellerId ? "web_checkout" : "public_checkout",
        notes: "Testdebitering Stripe — ingen affär.",
        items: {
          create: {
            variantId: preview.variant.id,
            qty: preview.qty,
            unitPriceExVat: preview.unitPriceExVat,
            designId: input.designId,
          },
        },
      },
    });
    if (input.designId) {
      await tx.design.update({
        where: { id: input.designId },
        data: { orderId: order.id, status: "SUBMITTED", userId: createdUserId },
      });
    }

    const invoiceNo = `DEMO-${orderNo}`;
    await tx.invoice.create({
      data: {
        orderId: order.id,
        resellerId,
        invoiceNo,
        status: "PAID",
        amountExVat: preview.amountExVat,
        vatAmount: preview.vatAmount,
        amountIncVat: preview.amountIncVat,
        issuedAt: new Date(),
        dueAt: new Date(),
        paidAt: new Date(),
      },
    });

    await tx.label.create({ data: { orderId: order.id, qty: preview.qty, status: "NOT_ORDERED" } });
    await tx.document.createMany({
      data: [
        {
          orderId: order.id,
          entityType: "ORDER",
          entityId: order.id,
          kind: "ORDER",
          title: `Orderbekräftelse ${orderNo}`,
          storageKey: `orders/${orderNo}.pdf`,
        },
        {
          orderId: order.id,
          entityType: "ORDER",
          entityId: order.id,
          kind: "FINANCE",
          title: `Faktura ${invoiceNo}`,
          storageKey: `invoices/${invoiceNo}.pdf`,
        },
      ],
    });

    await tx.statusEvent.createMany({
      data: [
        {
          entityType: "ORDER",
          entityId: order.id,
          toStatus: order.currentStatus,
          actorRole: createdAccount || input.existing?.role === "RESELLER" ? "RESELLER" : "PUBLIC",
          source: "checkout",
          payload: JSON.stringify({ email, demo: true }),
        },
        {
          entityType: "ORDER",
          entityId: order.id,
          fromStatus: order.currentStatus,
          toStatus: "INVOICED",
          actorRole: "PUBLIC",
          source: "stripe-test",
        },
        {
          entityType: "ORDER",
          entityId: order.id,
          fromStatus: "INVOICED",
          toStatus: "PAID",
          actorRole: "PUBLIC",
          source: "stripe-test",
        },
      ],
    });

    return { orderNo, invoiceNo, createdAccount, resellerId };
  });

  return {
    ...result,
    token: checkoutToken(result.orderNo),
    email,
    password: wantAccount ? input.password : undefined,
    amountIncVat: preview.amountIncVat,
    productName: preview.product.name,
    qty: preview.qty,
  };
}

export function dummyInvoicePdf(input: {
  invoiceNo: string;
  orderNo: string;
  company: string;
  email: string;
  productName: string;
  qty: number;
  unitPriceExVat: number;
  amountExVat: number;
  vatAmount: number;
  amountIncVat: number;
}) {
  return renderSimplePdf(`Faktura ${input.invoiceNo}`, [
    "Aqua Visibility AB  ·  Testdebitering",
    "Ingen affär sker. Kortet debiteras inte.",
    "",
    `Kund: ${input.company}`,
    `E-post: ${input.email}`,
    `Order: ${input.orderNo}`,
    `Fakturanr: ${input.invoiceNo}`,
    `Status: Betald (Stripe test 4242)`,
    "",
    `${input.productName}  ×  ${input.qty}`,
    `À-pris ex moms: ${input.unitPriceExVat.toFixed(2)} kr`,
    `Summa ex moms: ${input.amountExVat.toFixed(2)} kr`,
    `Moms 25%: ${input.vatAmount.toFixed(2)} kr`,
    `Att betala: ${input.amountIncVat.toFixed(2)} kr`,
    "",
    "Betalsätt: Stripe testkort · Visa · **** 4242",
    "Detta är en dummyfaktura för demonstration.",
  ]);
}
