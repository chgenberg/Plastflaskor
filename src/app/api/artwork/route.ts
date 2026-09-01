import { NextResponse } from "next/server";
import { isAquaAdmin } from "@/domain/policies/roles";
import { getSessionUser } from "@/server/rbac";
import { uploadArtworkForOrder } from "@/server/services/artwork.service";
import { safeInternalPath } from "@/domain/safePath";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "CUSTOMER" && !isAquaAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const form = await req.formData();
  const orderId = String(form.get("orderId") ?? "");
  const returnTo = String(form.get("returnTo") ?? "");
  const file = form.get("file");
  if (!orderId || !(file instanceof File)) {
    return NextResponse.json({ error: "Saknar fil eller order" }, { status: 400 });
  }
  await uploadArtworkForOrder({
    orderId,
    userId: user.id,
    role: user.role,
    resellerId: user.resellerId,
    customerId: user.customerId,
    fileName: file.name,
    mimeType: file.type,
    bytes: Buffer.from(await file.arrayBuffer()),
  });
  const dest = safeInternalPath(returnTo, "");
  if (dest) {
    return NextResponse.redirect(new URL(dest, req.url), 303);
  }
  return NextResponse.json({ ok: true });
}
