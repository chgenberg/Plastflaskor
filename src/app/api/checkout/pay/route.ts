import { getSessionUser } from "@/server/rbac";
import { CheckoutError, completeCheckout } from "@/server/services/checkout.service";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const existing = await getSessionUser();
    const createAccount = body.createAccount === true;
    const result = await completeCheckout({
      company: String(body.company ?? ""),
      email: String(body.email ?? ""),
      phone: String(body.phone ?? "") || undefined,
      city: String(body.city ?? ""),
      line1: String(body.line1 ?? ""),
      postalCode: String(body.postalCode ?? ""),
      productId: String(body.productId ?? ""),
      qty: Number(body.qty ?? 0),
      designId: String(body.designId ?? "") || undefined,
      createAccount,
      password: String(body.password ?? "") || undefined,
      cardNumber: String(body.cardNumber ?? ""),
      cardExp: String(body.cardExp ?? ""),
      cardCvc: String(body.cardCvc ?? ""),
      existing: existing
        ? { id: existing.id, role: existing.role, resellerId: existing.resellerId, customerId: existing.customerId, name: existing.name }
        : undefined,
    });

    if (result.createdAccount) {
      return Response.json({
        ok: true,
        redirect: "/partner",
        orderNo: result.orderNo,
        createdAccount: true,
        email: result.email,
      });
    }
    if (existing?.role === "RESELLER") {
      return Response.json({ ok: true, redirect: `/partner/ordrar/${result.orderNo}`, orderNo: result.orderNo });
    }
    if (existing?.role === "CUSTOMER") {
      return Response.json({ ok: true, redirect: `/konto/ordrar/${result.orderNo}`, orderNo: result.orderNo });
    }
    return Response.json({
      ok: true,
      redirect: `/kassa/bekraftelse?order=${result.orderNo}&t=${result.token}`,
      orderNo: result.orderNo,
    });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Kunde inte slutföra köpet.";
    return Response.json({ error: message }, { status: 400 });
  }
}
