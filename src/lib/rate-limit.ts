import { headers } from "next/headers";

type Bucket = { timestamps: number[] };

const store = new Map<string, Bucket>();

/** Drop empty / expired buckets occasionally to avoid unbounded growth. */
let lastCleanup = 0;
function maybeCleanup(now: number) {
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, bucket] of store) {
    if (bucket.timestamps.length === 0) store.delete(key);
  }
}

export type RateLimitCheck = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
  limit: number;
};

/**
 * Fixed-window style limiter: count hits in the last `windowMs`.
 * In-memory — best-effort on serverless (per instance). Still stops
 * casual brute-force / spam on a single node.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitCheck {
  const now = Date.now();
  maybeCleanup(now);
  const cutoff = now - windowMs;
  let bucket = store.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    store.set(key, bucket);
  }
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { ok: false, remaining: 0, retryAfterSec, limit };
  }

  bucket.timestamps.push(now);
  return {
    ok: true,
    remaining: Math.max(0, limit - bucket.timestamps.length),
    retryAfterSec: 0,
    limit,
  };
}

/** Client IP from proxy headers (Vercel / nginx). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}

export function clientIpFromRequest(req: {
  headers: { get(name: string): string | null };
}): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export const RATE_LIMITS = {
  loginEmail: { limit: 5, windowMs: 15 * 60_000 }, // 5 / 15m per IP+email
  loginIp: { limit: 25, windowMs: 15 * 60_000 }, // 25 / 15m per IP
  registerIp: { limit: 5, windowMs: 60 * 60_000 }, // 5 / hour per IP
  forgotEmail: { limit: 3, windowMs: 60 * 60_000 }, // 3 / hour per email
  forgotIp: { limit: 8, windowMs: 60 * 60_000 }, // 8 / hour per IP
  webhookIp: { limit: 120, windowMs: 60_000 }, // 120 / min (Stripe bursts)
  webhookBadSig: { limit: 20, windowMs: 60_000 }, // 20 bad sigs / min per IP
} as const;

export function rateLimitMessage(retryAfterSec: number): string {
  const mins = Math.ceil(retryAfterSec / 60);
  if (mins >= 2) {
    return `Too many attempts. Please try again in about ${mins} minutes.`;
  }
  return `Too many attempts. Please try again in ${retryAfterSec} second${
    retryAfterSec === 1 ? "" : "s"
  }.`;
}
