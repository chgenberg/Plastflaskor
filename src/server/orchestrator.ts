import { prisma } from "@/server/db";
import { exceptionsFor } from "@/domain/exceptions";
import { listAllOrders } from "@/server/services/order.service";
import { activateDueLeads, listLeads } from "@/server/services/lead.service";
import { dbCardToWorkboard, type DbCard } from "@/lib/orchestrator/cards";
import {
  latestHeartbeatRun,
  runHeartbeat,
  setHeartbeatChecks,
  setOrchestratorDb,
} from "@/lib/orchestrator/heartbeat";
import { emailPausedSeed, leadSeed, PULSE_KINDS, seedFromException } from "@/lib/orchestrator/probes";
import { loadWorkboard, mergeCards, type WorkboardCard } from "@/lib/orchestrator/workboard";
import { excerptMemory, readMemory } from "@/lib/orchestrator/memory";
import { canExecute, type Gate } from "@/lib/orchestrator/approvals";
import { NODES, type DomainId } from "@/lib/orchestrator/graph";

let wired = false;

export function wireOrchestrator() {
  if (wired) return;
  setOrchestratorDb({
    card: {
      findUnique: (args) => prisma.orchestratorCard.findUnique(args),
      findMany: (args) => prisma.orchestratorCard.findMany(args),
      create: (args) => prisma.orchestratorCard.create(args as never),
      update: (args) => prisma.orchestratorCard.update(args as never),
    },
    run: {
      create: (args) => prisma.orchestratorRun.create(args),
      update: (args) => prisma.orchestratorRun.update(args as never),
      findFirst: (args) => prisma.orchestratorRun.findFirst(args),
    },
  });
  setHeartbeatChecks([
    {
      async probe() {
        await activateDueLeads();
        const orders = await listAllOrders();
        const items = exceptionsFor(orders).filter((e) => PULSE_KINDS.includes(e.kind));
        return items.slice(0, 80).map(seedFromException);
      },
    },
    {
      async probe() {
        const { leads } = await listLeads();
        const week = new Date();
        week.setDate(week.getDate() + 7);
        return leads
          .filter((lead) => lead.status === "ACTIVE" && lead.expectedAt <= week)
          .slice(0, 12)
          .map((lead) =>
            leadSeed(
              lead.id,
              "Repeat leads är aktuella denna vecka",
              `${lead.sourceOrder.orderNo} · ${lead.customer.name}`,
            ),
          );
      },
    },
    {
      async probe() {
        const paused = emailPausedSeed();
        return paused ? [paused] : [];
      },
    },
  ]);
  wired = true;
}

export async function runAquaHeartbeat() {
  wireOrchestrator();
  return runHeartbeat();
}

/** Skip a fresh tick so dashboard + Agenten inte dubbelkör samma runda. */
export async function runAquaHeartbeatIfStale(maxAgeMs = 90_000) {
  wireOrchestrator();
  const last = await latestHeartbeatRun();
  if (last?.endedAt && last.status === "ok" && Date.now() - new Date(last.endedAt).getTime() < maxAgeMs) {
    return {
      ok: true,
      runId: last.id,
      findings: last.findings,
      opened: [] as string[],
      resolved: [] as string[],
      fixed: [] as string[],
      summary: last.summary,
      at: last.endedAt.toISOString(),
    };
  }
  return runHeartbeat();
}

export async function loadOrchestratorBoard(): Promise<WorkboardCard[]> {
  wireOrchestrator();
  const file = await loadWorkboard();
  let dbCards: WorkboardCard[] = [];
  try {
    const rows = await prisma.orchestratorCard.findMany({
      orderBy: { updatedAt: "desc" },
      take: 80,
    });
    dbCards = rows.map((row) => dbCardToWorkboard(row as DbCard));
  } catch {
    dbCards = [];
  }
  return mergeCards(file.cards, dbCards);
}

export async function orchestratorSnapshot() {
  wireOrchestrator();
  const [cards, run, memory] = await Promise.all([
    loadOrchestratorBoard(),
    latestHeartbeatRun(),
    readMemory(),
  ]);
  const open = cards.filter((c) => c.status !== "done");
  const pulse: Record<string, number> = {};
  for (const node of NODES) pulse[node.id] = 0;
  for (const card of open) {
    pulse[card.domainId] = (pulse[card.domainId] ?? 0) + 1;
  }
  return {
    cards,
    open,
    needsDecision: open.filter((c) => c.gate !== "none"),
    run,
    memory: excerptMemory(memory.body),
    pulse: pulse as Record<DomainId, number>,
  };
}

export async function patchOrchestratorCard(input: {
  key: string;
  action: "approve" | "reject" | "move";
  status?: string;
}) {
  wireOrchestrator();
  const row = await prisma.orchestratorCard.findUnique({ where: { key: input.key } });
  if (!row) return { ok: false as const, reason: "Kortet finns inte." };

  if (input.action === "reject") {
    await prisma.orchestratorCard.update({
      where: { key: input.key },
      data: { status: "blocked", rejectedAt: new Date() },
    });
    return { ok: true as const };
  }

  if (input.action === "move" && input.status) {
    await prisma.orchestratorCard.update({
      where: { key: input.key },
      data: { status: input.status },
    });
    return { ok: true as const };
  }

  if (input.action === "approve") {
    if (input.key === "email-paused") {
      return { ok: false as const, reason: "Mejlpaus godkänns inte bort här." };
    }
    const gate = row.gate as Gate;
    const decision = canExecute({ gate, explicitYes: true, bugHuntClean: false });
    if (gate === "irreversible" || gate === "deploy" || !decision.ok) {
      await prisma.orchestratorCard.update({
        where: { key: input.key },
        data: { status: "blocked", approvedAt: null },
      });
      return { ok: false as const, reason: decision.reason };
    }
    await prisma.orchestratorCard.update({
      where: { key: input.key },
      data: { status: gate === "none" ? "ready" : "ready", approvedAt: new Date() },
    });
    return { ok: true as const };
  }

  return { ok: false as const, reason: "Okänd åtgärd." };
}
