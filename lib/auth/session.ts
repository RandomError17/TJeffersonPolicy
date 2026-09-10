/**
 * Server-side sessions.
 *
 * Design notes:
 *  - The cookie holds a 256-bit random token and nothing else. No user id, no
 *    role, no name. Anything the browser could tamper with is not trusted.
 *  - Only SHA-256(token) is stored, so a database dump cannot be replayed.
 *  - The role is re-read from the database on every request, so demoting an
 *    officer takes effect immediately rather than at the next sign-in.
 */
import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "../db";
import { env, isProduction } from "../env";

export const SESSION_COOKIE = "tjpd_session";
export const CSRF_COOKIE = "tjpd_csrf";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
/** Sliding-window refresh: only touch the row when it is meaningfully stale. */
const REFRESH_AFTER_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Coarse client fingerprint for the audit trail. Never stored in the clear. */
function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`${env.SESSION_SECRET}:${ip}`).digest("hex").slice(0, 32);
}

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/",
} as const;

export interface SessionContext {
  user: User;
  sessionId: string;
}

/**
 * Create a session and set the cookies. Returns the raw token for tests; the
 * caller normally ignores it.
 */
export async function createSession(
  userId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {},
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      userAgent: meta.userAgent?.slice(0, 250) ?? null,
      ipHash: hashIp(meta.ip ?? null),
    },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { ...baseCookieOptions, expires: expiresAt });
  // Double-submit CSRF token. Readable by our own scripts by design; it is
  // useless to a cross-origin attacker, who cannot read it back out.
  jar.set(CSRF_COOKIE, randomBytes(32).toString("base64url"), {
    ...baseCookieOptions,
    httpOnly: false,
    expires: expiresAt,
  });

  return token;
}

/**
 * Resolve the current session, or null. Expired rows are deleted on sight so
 * the table self-cleans under normal traffic.
 */
export async function getSession(): Promise<SessionContext | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const record = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!record) return null;

  if (record.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: record.id } }).catch(() => {});
    return null;
  }

  if (Date.now() - record.lastUsedAt.getTime() > REFRESH_AFTER_MS) {
    await prisma.session
      .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});
  }

  return { user: record.user, sessionId: record.id };
}

/** Sign out of this browser only. */
export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.delete(SESSION_COOKIE);
  jar.delete(CSRF_COOKIE);
}

/** Sign out everywhere, e.g. after a role change or a suspected compromise. */
export async function destroyAllSessionsForUser(userId: string): Promise<number> {
  const { count } = await prisma.session.deleteMany({ where: { userId } });
  return count;
}

/** Housekeeping for a scheduled job; not required for correctness. */
export async function purgeExpiredSessions(): Promise<number> {
  const { count } = await prisma.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  return count;
}

/** Constant-time comparison that tolerates differing lengths. */
export function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still do a comparison so the timing does not leak the length check.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
