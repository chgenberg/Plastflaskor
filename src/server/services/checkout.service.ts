import { createHmac, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../db";
import { resolveUnitPrice } from "./catalog.service";
import { renderSimplePdf } from "../pdf/simplePdf";
import { buildPriceSnapshot } from "@/domain/extras";
import { emptyCupDocument, parseCupDocument } from "@/domain/cupDocument";
import { visualSpecFromOptions } from "@/domain/visualSpec";
import { parseCupOptions } from "@/domain/cupCatalog";
import { imageForProduct } from "@/domain/productImages";
import { addLeadTimeDays } from "@/domain/orderBrief";

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

export const CHECKOUT_PAPER_CUP_ONLY = "Endast pappersmuggar kan beställas i kassan.";

export function assertCheckoutPaperCup(category: string) {
  if (category !== "PAPER_CUP") {
    throw new CheckoutError(CHECKOUT_PAPER_CUP_ONLY);
  }
}

export async function previewCheckout(
  productId: string,
  qty: number,
  resellerId?: string | null,
  customerId?: string | null,
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true, printRequirements: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product?.isPublic) throw new CheckoutError("Produkten saknas.");
  assertCheckoutPaperCup(product.category);
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
  } else if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { priceList: { include: { items: true } } },
    });
    items = customer?.priceList?.items ?? [];
    if (!items.length) {
      const standard = await prisma.priceList.findUnique({
        where: { code: "STANDARD" },
        include: { items: true },
      });
      items = standard?.items ?? [];
    }
  }
  if (!resellerId && !customerId) {
    return {
      product,
      variant,
      qty: safeQty,
      unitPriceExVat: null as number | null,
      amountExVat: null as number | null,
      vatAmount: null as number | null,
      amountIncVat: null as number | null,
      listName: "Logga in för pris",
      pricesHidden: true,
    };
  }
  const price = resolveUnitPrice(items, variant.id, safeQty);
  const unit = price?.unitPriceExVat ?? null;
  if (unit == null) {
    return {
      product,
      variant,
      qty: safeQty,
      unitPriceExVat: null,
      amountExVat: null,
      vatAmount: null,
      amountIncVat: null,
      listName: "Kontakta oss för pris",
      pricesHidden: true,
    };
  }
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
    listName: "Din lista",
    pricesHidden: false,
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
  existing?: { id: string; role: string; resellerId?: string | null; customerId?: string | null; name?: string | null };
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

  if (!input.existing?.resellerId && input.existing?.role !== "CUSTOMER") {
    throw new CheckoutError("Logga in för att se pris och slutföra order.", 401);
  }
  const preview = await previewCheckout(
    input.productId,
    input.qty,
    input.existing?.resellerId,
    input.existing?.customerId,
  );
  if (
    preview.pricesHidden ||
    preview.unitPriceExVat == null ||
    preview.amountExVat == null ||
    preview.vatAmount == null ||
    preview.amountIncVat == null
  ) {
    throw new CheckoutError("Logga in för att se pris och slutföra order.", 401);
  }
  const unitPriceExVat = preview.unitPriceExVat;
  const amountIncVat = preview.amountIncVat;
  const design = input.designId
    ? await prisma.design.findUnique({ where: { id: input.designId } })
    : null;
  if (input.designId && (!design || design.productId !== input.productId)) {
    throw new CheckoutError("Designen hör inte till den valda produkten.");
  }

  const cupOpts = parseCupOptions(preview.variant.optionsJson);
  const fromDesign = parseCupDocument(design?.cupDocumentJson);
  const cupDoc = fromDesign
    ? { ...fromDesign, productSlug: preview.product.slug, quantity: preview.qty }
    : emptyCupDocument({
        productSlug: preview.product.slug,
        quantity: preview.qty,
        variantSku: preview.variant.sku,
        wall: cupOpts.wall,
        eco: cupOpts.eco ?? false,
        finish: cupOpts.finish ?? "matte",
        lid: cupOpts.lid ?? "none",
        requirements: preview.product.printRequirements.map((r) => ({
          code: r.code,
          label: r.label,
          placed: false,
          required: r.required,
        })),
      });
  const visual = visualSpecFromOptions({
    productName: preview.product.name,
    qty: preview.qty,
    volumeMl: preview.variant.volumeMl,
    optionsJson: JSON.stringify({ ...cupOpts, ...cupDoc.options }),
    imageSrc: imageForProduct(preview.product.slug),
  });
  const priceSnapshot = buildPriceSnapshot({
    lines: [{ name: preview.product.name, qty: preview.qty, unitPriceExVat }],
    extras: [],
  });

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
    const factory = await tx.factory.findFirst({ where: { isActive: true } });
    const actorRole =
      createdAccount || input.existing?.role === "RESELLER"
        ? "RESELLER"
        : input.existing?.role === "CUSTOMER"
          ? "CUSTOMER"
          : "PUBLIC";
    const order = await tx.order.create({
      data: {
        orderNo,
        resellerId,
        customerId: customer.id,
        currentStatus: "SUBMITTED",
        buyerType: input.existing?.role === "CUSTOMER" ? "CUSTOMER" : "RESELLER",
        shippingAddressId: addr.id,
        factoryId: factory?.id,
        source: createdAccount || input.existing?.resellerId ? "web_checkout" : "public_checkout",
        notes: "Testdebitering validerad — order mottagen, orderbekräftelse med korrektur inom 24h.",
        preliminaryDate: addLeadTimeDays(preview.product.leadTimeDays),
        visualSpecJson: JSON.stringify(visual),
        cupDocumentJson: JSON.stringify(cupDoc),
        priceSnapshotJson: JSON.stringify(priceSnapshot),
        items: {
          create: {
            variantId: preview.variant.id,
            qty: preview.qty,
            unitPriceExVat,
            designId: input.designId,
            visualSpecJson: JSON.stringify(visual),
            cupDocumentJson: JSON.stringify(cupDoc),
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

    if (factory) {
      await tx.productionJob.create({
        data: { orderId: order.id, factoryId: factory.id, status: "NOT_PLANNED" },
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: { currentStatus: "AQUA_REVIEW" },
    });

    await tx.document.create({
      data: {
        orderId: order.id,
        entityType: "ORDER",
        entityId: order.id,
        kind: "ORDER",
        title: `Orderbekräftelse ${orderNo}`,
        storageKey: `orders/${orderNo}.pdf`,
      },
    });

    await tx.statusEvent.createMany({
      data: [
        {
          entityType: "ORDER",
          entityId: order.id,
          toStatus: "SUBMITTED",
          actorRole,
          source: "checkout",
          payload: JSON.stringify({ email, demo: true }),
        },
        {
          entityType: "ORDER",
          entityId: order.id,
          fromStatus: "SUBMITTED",
          toStatus: "AQUA_REVIEW",
          actorRole,
          source: "checkout",
        },
      ],
    });

    return { orderNo, createdAccount, resellerId };
  });

  return {
    ...result,
    token: checkoutToken(result.orderNo),
    email,
    password: wantAccount ? input.password : undefined,
    amountIncVat,
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
