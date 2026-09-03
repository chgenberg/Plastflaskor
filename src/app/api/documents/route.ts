import { NextResponse } from "next/server";
import { DocumentKind } from "@prisma/client";
import { isAquaAdmin } from "@/domain/policies/roles";
import { getSessionUser } from "@/server/rbac";
import { getOrderRecord, saveUploadedDocument } from "@/server/services/document.service";
import { safeInternalPath } from "@/domain/safePath";

const KINDS = Object.values(DocumentKind);

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const orderId = String(form.get("orderId") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const kindRaw = String(form.get("kind") ?? "OTHER");
  const returnTo = String(form.get("returnTo") ?? "");
  const file = form.get("file");
  if (!orderId || !title || !(file instanceof File)) {
    return NextResponse.json({ error: "Saknar fil, titel eller order" }, { status: 400 });
  }
  const order = await getOrderRecord(orderId);
  if (!order) return NextResponse.json({ error: "Order saknas" }, { status: 404 });
  if (!isAquaAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const kind = KINDS.includes(kindRaw as DocumentKind) ? (kindRaw as DocumentKind) : DocumentKind.OTHER;
  const bytes = Buffer.from(await file.arrayBuffer());
  await saveUploadedDocument({
    orderId,
    title,
    kind,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    bytes,
  });
  const dest = safeInternalPath(returnTo, "");
  if (dest) {
    return NextResponse.redirect(new URL(dest, req.url), 303);
  }
  return NextResponse.json({ ok: true });
}
