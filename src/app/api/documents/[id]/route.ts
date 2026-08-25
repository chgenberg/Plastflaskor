import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/rbac";
import { documentPdf, getAuthorizedDocument, readUploadedBytes } from "@/server/services/document.service";
import { contentDisposition } from "@/domain/safePath";

function mimeFor(key: string) {
  const ext = key.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "svg") return "image/svg+xml";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream";
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const doc = await getAuthorizedDocument(id, user);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const inline = new URL(req.url).searchParams.get("inline") === "1";
  const uploaded = await readUploadedBytes(doc.storageKey);
  const bytes = uploaded ?? documentPdf(doc);
  const filename = uploaded
    ? doc.storageKey.split("/").pop() ?? `${doc.title}.bin`
    : `${doc.title.replace(/[^\wåäöÅÄÖ .-]+/g, "")}.pdf`;
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": uploaded ? mimeFor(doc.storageKey) : "application/pdf",
      "Content-Disposition": contentDisposition(filename, inline),
      "Cache-Control": "private, no-store",
    },
  });
}
