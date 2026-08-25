import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { assertCheckoutToken, CheckoutError, dummyInvoicePdf } from "@/server/services/checkout.service";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const orderNo = url.searchParams.get("order") ?? "";
    const token = url.searchParams.get("t") ?? "";
    assertCheckoutToken(orderNo, token);
    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: {
        customer: true,
        invoice: true,
        items: { include: { variant: { include: { product: true } } } },
      },
    });
    if (!order?.invoice) return NextResponse.json({ error: "Fakturan saknas." }, { status: 404 });
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
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Kunde inte hämta fakturan." }, { status: 400 });
  }
}
