/**
 * Scheduled tick: probe → upsert cards → resolve gone → Hands → OrchestratorRun.
 * Never deploy or irreversible Hands.
 */

import type { DomainId } from "@/lib/orchestrator/graph";
import type { Gate } from "@/lib/orchestrator/approvals";
import type { CardStatus } from "@/lib/orchestrator/workboard";
import { runSafeHands, setCardWriter } from "@/lib/orchestrator/hands";

export type Seed = {
  key: string;
  title: string;
  body: string;
  domainId: DomainId;
  gate: Gate;
  files: string[];
  playbook?: string;
};

export type HeartbeatCheck = {
  probe: () => Promise<Seed[]>;
};

export const CHECKS: HeartbeatCheck[] = [];

export function setHeartbeatChecks(checks: HeartbeatCheck[]) {
  CHECKS.length = 0;
  CHECKS.push(...checks);
}

export type HeartbeatResult = {
  ok: boolean;
  runId: string | null;
  findings: number;
  opened: string[];
  resolved: string[];
  fixed: string[];
  summary: string;
  at: string;
};

type CardRow = {
  key: string;
  status: string;
  body: string;
};

type OrchestratorDb = {
  card: {
    findUnique: (args: { where: { key: string } }) => Promise<CardRow | null>;
    findMany: (args: {
      where: { source: string; status: { not: string }; key: { startsWith: string } };
      select: { key: true };
    }) => Promise<{ key: string }[]>;
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    update: (args: {
      where: { key: string };
      data: Record<string, unknown>;
    }) => Promise<unknown>;
  };
  run: {
    create: (args: { data: { kind: string; status: string } }) => Promise<{ id: string }>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<unknown>;
    findFirst: (args: {
      where: { kind: string };
      orderBy: { startedAt: "desc" };
    }) => Promise<{
      id: string;
      startedAt: Date;
      endedAt: Date | null;
      status: string;
      summary: string;
      findings: number;
    } | null>;
  };
};

let db: OrchestratorDb | null = null;

export function setOrchestratorDb(next: OrchestratorDb | null) {
  db = next;
  if (next) {
    setCardWriter({
      findUnique: next.card.findUnique,
      update: async (args) =>
        next.card.update({
          where: args.where,
          data: {
            status: args.data.status,
            body: args.data.body,
          },
        }),
    });
  } else {
    setCardWriter(null);
  }
}

function tablesMissing(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /OrchestratorCard|OrchestratorRun|does not exist|P2021/i.test(msg);
}

async function upsertOpen(seed: Seed): Promise<"opened" | "kept"> {
  if (!db) return "kept";
  const existing = await db.card.findUnique({ where: { key: seed.key } });
  if (existing && existing.status !== "done") {
    await db.card.update({
      where: { key: seed.key },
      data: {
        title: seed.title,
        body: seed.body,
        domainId: seed.domainId,
        gate: seed.gate,
        playbook: seed.playbook ?? "",
      },
    });
    return "kept";
  }
  if (existing && existing.status === "done") {
    await db.card.update({
      where: { key: seed.key },
      data: {
        title: seed.title,
        body: seed.body,
        status: "inbox",
        domainId: seed.domainId,
        gate: seed.gate,
        playbook: seed.playbook ?? "",
        filesJson: JSON.stringify(seed.files),
        rejectedAt: null,
        approvedAt: null,
      },
    });
    return "opened";
  }
  await db.card.create({
    data: {
      key: seed.key,
      title: seed.title,
      body: seed.body,
      status: "inbox",
      domainId: seed.domainId,
      gate: seed.gate,
      playbook: seed.playbook ?? "",
      filesJson: JSON.stringify(seed.files),
      source: "heartbeat",
    },
  });
  return "opened";
}

async function resolveIfOpen(key: string): Promise<boolean> {
  if (!db) return false;
  const row = await db.card.findUnique({ where: { key } });
  if (!row || row.status === "done") return false;
  await db.card.update({
    where: { key },
    data: {
      status: "done" as CardStatus,
      body: `${row.body}\n\nLöst av heartbeat.`,
    },
  });
  return true;
}

export async function runHeartbeat(): Promise<HeartbeatResult> {
  const at = new Date().toISOString();
  if (!db) {
    return {
      ok: true,
      runId: null,
      findings: 0,
      opened: [],
      resolved: [],
      fixed: [],
      summary: "HEARTBEAT_OK",
      at,
    };
  }

  let runId: string | null = null;
  try {
    const run = await db.run.create({
      data: { kind: "heartbeat", status: "running" },
    });
    runId = run.id;
  } catch (e) {
    if (tablesMissing(e)) {
      return {
        ok: false,
        runId: null,
        findings: 0,
        opened: [],
        resolved: [],
        fixed: [],
        summary: "Orchestrator-tabeller saknas. Kör prisma db push.",
        at,
      };
    }
    throw e;
  }

  try {
    const opened: string[] = [];
    const resolved: string[] = [];
    const liveKeys = new Set<string>();
    const prefixes = new Set<string>();

    for (const check of CHECKS) {
      const seeds = await check.probe();
      for (const seed of seeds) {
        liveKeys.add(seed.key);
        const colon = seed.key.indexOf(":");
        if (colon > 0) prefixes.add(seed.key.slice(0, colon + 1));
        const r = await upsertOpen(seed);
        if (r === "opened") opened.push(seed.key);
      }
    }

    for (const prefix of prefixes) {
      const openRows = await db.card.findMany({
        where: {
          source: "heartbeat",
          status: { not: "done" },
          key: { startsWith: prefix },
        },
        select: { key: true },
      });
      for (const row of openRows) {
        if (!liveKeys.has(row.key) && (await resolveIfOpen(row.key))) {
          resolved.push(row.key);
        }
      }
    }

    const fixed = await runSafeHands([...liveKeys]);
    for (const key of fixed) liveKeys.delete(key);

    const findings = liveKeys.size;
    const summary =
      findings === 0 && opened.length === 0 && resolved.length === 0 && fixed.length === 0
        ? "HEARTBEAT_OK"
        : `${findings} öppna, ${opened.length} nya, ${resolved.length} lösta, ${fixed.length} lagade.`;

    await db.run.update({
      where: { id: runId },
      data: { status: "ok", summary, findings, endedAt: new Date() },
    });

    return { ok: true, runId, findings, opened, resolved, fixed, summary, at };
  } catch (e) {
    const summary = e instanceof Error ? e.message : "HEARTBEAT_FAILED";
    await db.run
      .update({
        where: { id: runId! },
        data: { status: "error", summary, endedAt: new Date() },
      })
      .catch(() => {});
    return {
      ok: false,
      runId,
      findings: 0,
      opened: [],
      resolved: [],
      fixed: [],
      summary,
      at,
    };
  }
}

export async function latestHeartbeatRun() {
  if (!db) return null;
  try {
    return await db.run.findFirst({
      where: { kind: "heartbeat" },
      orderBy: { startedAt: "desc" },
    });
  } catch (e) {
    if (tablesMissing(e)) return null;
    throw e;
  }
}
