import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/server/rbac";
import { orchestratorSnapshot, patchOrchestratorCard } from "@/server/orchestrator";

export const dynamic = "force-dynamic";

function isOps(role?: string) {
  return role === "AQUA_STAFF" || role === "AQUA_ADMIN";
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || !isOps(user.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const snap = await orchestratorSnapshot();
  return NextResponse.json(snap);
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !isOps(user.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const body = (await req.json()) as { id?: string; action?: "approve" | "reject" | "move"; status?: string };
  if (!body.id || !body.action) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  const result = await patchOrchestratorCard({ key: body.id, action: body.action, status: body.status });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
