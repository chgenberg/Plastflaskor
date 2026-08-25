import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/rbac";
import { artworkFilePdf, getAuthorizedArtworkFile } from "@/server/services/document.service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const file = await getAuthorizedArtworkFile(id, user);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const bytes = artworkFilePdf(file);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file.fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
