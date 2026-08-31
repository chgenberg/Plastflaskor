import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/rbac";
import { prisma } from "@/server/db";
import { dummyInvoicePdf } from "@/server/services/checkout.service";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "FACTORY") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const orderNo = url.searchParams.get("order") ?? "";
  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: {
      customer: true,
      invoice: true,
      items: { include: { variant: { include: { product: true } } } },
    },
  });
  if (!order?.invoice) return NextResponse.json({ error: "Fakturan saknas." }, { status: 404 });
  if (user.role === "CUSTOMER" && order.customerId !== user.customerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (user.role === "RESELLER" && order.resellerId !== user.resellerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = order.items[0];
  const bytes = dummyInvoicePdf({
    invoiceNo: order.invoice.invoiceNo,
    orderNo: order.orderNo,
    company: order.customer.name,
    email: order.customer.email ?? "",
    productName: item?.variant.product.name ?? "Produkt",
    qty: item?.qty ?? 0,
    unitPriceExVat: item?.unitPriceExVat ?? 0,
    amountExVat: order.invoice.amountExVat,
    vatAmount: order.invoice.vatAmount,
    amountIncVat: order.invoice.amountIncVat,
  });
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${order.invoice.invoiceNo}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
