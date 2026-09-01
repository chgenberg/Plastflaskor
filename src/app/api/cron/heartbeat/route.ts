import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runAquaHeartbeat } from "@/server/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

function authorized(req: NextRequest): { ok: boolean; status?: number; msg?: string } {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV === "production"
      ? { ok: false, status: 503, msg: "CRON_NOT_CONFIGURED" }
      : { ok: true };
  }
  const a = Buffer.from(req.headers.get("x-cron-secret") || "");
  const b = Buffer.from(secret);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  return ok ? { ok: true } : { ok: false, status: 401, msg: "UNAUTHORIZED" };
}

export async function POST(req: NextRequest) {
  const auth = authorized(req);
  if (!auth.ok) return NextResponse.json({ error: auth.msg }, { status: auth.status });
  const result = await runAquaHeartbeat();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
