import { NextResponse } from "next/server";
import { isAquaAdmin } from "@/domain/policies/roles";
import { planFromItem } from "@/domain/bottlerPlan";
import { contentDisposition } from "@/domain/safePath";
import { getSessionUser } from "@/server/rbac";
import { renderBottlerPlanPdf } from "@/server/pdf/bottlerPlanPdf";
import { listJobsForFactory } from "@/server/services/production.service";
import { getLocalFile } from "@/server/storage/local";
import { scopedFactoryId } from "@/server/supplierAccess";

export const runtime = "nodejs";

function jpegBytes(bytes: Buffer) {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return bytes;
  return undefined;
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "BOTTLER" && user.role !== "FACTORY" && !isAquaAdmin(user.role))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  if (url.searchParams.get("empty") === "1") {
    const bytes = renderBottlerPlanPdf([]);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition("bottler-plan.pdf", true),
        "Cache-Control": "private, no-store",
      },
    });
  }
  const factoryId = scopedFactoryId(user);
  const ids = url.searchParams.get("ids")?.split(",").map((id) => id.trim()).filter(Boolean) ?? [];
  const jobs = await listJobsForFactory(factoryId, "bottler");
  const wanted = new Set(ids);
  const onDesk = new Set([
    "LABELS_DISPATCHED",
    "LABELS_RECEIVED",
    "PRODUCTION_SCHEDULED",
    "IN_PRODUCTION",
    "READY_TO_SHIP",
  ]);
  const selected = (
    ids.length
      ? jobs.filter((j) => wanted.has(j.id))
      : jobs.filter((j) => onDesk.has(j.order.currentStatus))
  ).slice(0, 80);
  const pages = await Promise.all(
    selected.map(async (j) => {
      const item = j.order.items[0];
      const plan = planFromItem({
        volumeMl: item?.variant.volumeMl,
        visualSpecJson: j.order.visualSpecJson ?? item?.visualSpecJson,
        optionsJson: item?.variant.optionsJson,
        productName: item?.variant.product.name,
      });
      const version = j.order.artworkVersions[0];
      const stored = version ? await getLocalFile(version.storageKey) : null;
      const artwork = version?.title ?? j.order.documents.find((d) => d.kind === "ARTWORK")?.title;
      return {
        orderNo: j.order.orderNo,
        customer: j.order.customer.name,
        product: item?.variant.product.name ?? "Profilvatten",
        qty: j.order.items.reduce((sum, line) => sum + line.qty, 0),
        ...plan,
        artworkTitle: artwork,
        artworkJpeg: stored ? jpegBytes(stored) : undefined,
      };
    }),
  );
  const bytes = renderBottlerPlanPdf(pages);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition("bottler-plan.pdf", true),
      "Cache-Control": "private, no-store",
    },
  });
}
