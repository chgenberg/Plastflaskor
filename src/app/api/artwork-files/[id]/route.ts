import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/rbac";
import { artworkFilePdf, getAuthorizedArtworkFile } from "@/server/services/document.service";
import { getLocalFile } from "@/server/storage/local";
import { contentDisposition } from "@/domain/safePath";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const file = await getAuthorizedArtworkFile(id, user);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const inline = new URL(req.url).searchParams.get("inline") === "1";
  const uploaded = await getLocalFile(file.storageKey);
  const bytes = uploaded ?? artworkFilePdf(file);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": uploaded ? file.mimeType || "application/octet-stream" : "application/pdf",
      "Content-Disposition": contentDisposition(file.fileName, inline),
      "Cache-Control": "private, no-store",
    },
  });
}
