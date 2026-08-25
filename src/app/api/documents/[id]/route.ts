import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/rbac";
import { documentPdf, getAuthorizedDocument } from "@/server/services/document.service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const doc = await getAuthorizedDocument(id, user);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const bytes = documentPdf(doc);
  const filename = `${doc.title.replace(/[^\wåäöÅÄÖ .-]+/g, "")}.pdf`;
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
