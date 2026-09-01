import { NextResponse } from "next/server";
import { isAquaAdmin } from "@/domain/policies/roles";
import { contentDisposition } from "@/domain/safePath";
import { formatShipAddress } from "@/domain/bottleCatalog";
import { getSessionUser } from "@/server/rbac";
import { renderSimplePdf } from "@/server/pdf/simplePdf";
import { getJob } from "@/server/services/production.service";
import { scopedFactoryId } from "@/server/supplierAccess";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "BOTTLER" && user.role !== "FACTORY" && !isAquaAdmin(user.role))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const jobId = new URL(req.url).searchParams.get("jobId")?.trim();
  if (!jobId) return NextResponse.json({ error: "Saknar jobb" }, { status: 400 });
  const job = await getJob(jobId, scopedFactoryId(user), "bottler");
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const item = job.order.items[0];
  const ship = job.order.shipments.find((s) => s.type === "GOODS_TO_CUSTOMER") ?? job.order.shipments[0];
  const addr = formatShipAddress(job.order.shippingAddress);
  const tracking = ship?.trackingNo ?? `MOCK-${job.order.orderNo}`;
  const bytes = renderSimplePdf(`Fraktsedel ${job.order.orderNo}`, [
    "Mock-fraktsedel. Live transportör kopplas senare.",
    "",
    `Order: ${job.order.orderNo}`,
    `Kund: ${job.order.customer.name}`,
    `Leverans: ${addr ?? "–"}`,
    `Innehåll: ${item?.variant.product.name ?? "Profilvatten"}`,
    `Antal: ${job.order.items.reduce((sum, line) => sum + line.qty, 0).toLocaleString("sv-SE")} st`,
    `Transportör: ${ship?.carrier ?? "Bring (mock)"}`,
    `Spårning: ${tracking}`,
    `Kolli: ${ship?.packages ?? 1}`,
    ship?.weightKg != null ? `Vikt: ${ship.weightKg} kg` : "",
    "",
    "Ingen pris- eller fakturainformation.",
  ].filter(Boolean));
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDisposition(`fraktsedel-${job.order.orderNo}.pdf`, true),
      "Cache-Control": "private, no-store",
    },
  });
}
