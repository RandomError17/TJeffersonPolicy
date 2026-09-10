/**
 * In-process fixed-window rate limiter.
 *
 * Deliberately simple and dependency-free: this app runs at classroom scale.
 * The limit is per server instance, so a multi-instance deployment should move
 * `consume` behind Redis or the platform's own limiter — the call sites do not
 * change.
 */
import { HttpError } from "../auth/guards";

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
/** Bound the map so a flood of distinct keys cannot exhaust memory. */
const MAX_KEYS = 10_000;

export interface RateLimitRule {
  /** Requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export const RATE_LIMITS = {
  /** Sign-in starts: enough for genuine retries, not for grinding. */
  auth: { limit: 10, windowMs: 10 * 60_000 },
  /** Ordinary member writes. */
  write: { limit: 60, windowMs: 60_000 },
  /** Outbound calls to third parties (Tabroom import). */
  external: { limit: 20, windowMs: 10 * 60_000 },
} as const satisfies Record<string, RateLimitRule>;

export function consume(key: string, rule: RateLimitRule): void {
  const now = Date.now();

  if (windows.size > MAX_KEYS) {
    for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
    if (windows.size > MAX_KEYS) windows.clear();
  }

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + rule.windowMs });
    return;
  }

  existing.count += 1;
  if (existing.count > rule.limit) {
    const seconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    throw new HttpError(429, `Too many requests. Try again in ${seconds} second${seconds === 1 ? "" : "s"}.`, "rate_limited");
  }
}

/** Best-effort client identifier behind a proxy. */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}

/** Test-only: drop all counters. */
export function resetRateLimits(): void {
  windows.clear();
}
