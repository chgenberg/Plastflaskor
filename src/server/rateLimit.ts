const buckets = new Map<string, { n: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const row = buckets.get(key);
  if (!row || row.resetAt < now) {
    buckets.set(key, { n: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (row.n >= limit) return { ok: false, remaining: 0 };
  row.n += 1;
  return { ok: true, remaining: limit - row.n };
}
