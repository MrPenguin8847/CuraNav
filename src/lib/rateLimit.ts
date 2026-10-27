/**
 * Lightweight in-memory rate limiter for Next.js API routes.
 *
 * Uses a sliding-window counter keyed on a caller-supplied identifier (IP
 * address, user ID, etc.).  The store is per-process: on a serverless
 * platform each function instance has its own map, so this provides a
 * best-effort guard rather than a global hard cap.  For a strict global cap,
 * back this with Redis / Upstash.
 *
 * Usage:
 *   const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
 *   const limit = rateLimit(ip, { max: 20, windowMs: 60_000 });
 *   if (!limit.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface Entry {
  count: number;
  resetAt: number;
}

// Global store shared across all callers in the same process.
const store = new Map<string, Entry>();

// Purge stale entries every 10 minutes to prevent unbounded memory growth.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 10 * 60 * 1_000);
}

export interface RateLimitOptions {
  /** Maximum number of requests allowed within `windowMs`. */
  max: number;
  /** Sliding window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  { max, windowMs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count += 1;
  const ok = entry.count <= max;
  return { ok, remaining: Math.max(0, max - entry.count), resetAt: entry.resetAt };
}

/**
 * Extract the best available IP from a Next.js request.
 * Trusts the X-Forwarded-For header set by Vercel / Cloudflare.
 */
export function getClientIp(req: Request): string {
  const forwarded = (req.headers as unknown as Headers).get?.("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
