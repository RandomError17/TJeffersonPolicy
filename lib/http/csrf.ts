/**
 * CSRF protection for state-changing requests.
 *
 * Three independent checks, because any one of them can be weakened by a
 * browser quirk or a misconfiguration:
 *   1. SameSite=Lax on the session cookie (set in lib/auth/session.ts).
 *   2. Origin/Referer must match APP_URL.
 *   3. Double-submit token: a readable cookie echoed in the X-CSRF-Token header.
 *      A cross-origin page can cause a request but cannot read the cookie to
 *      populate the header.
 */
import { CSRF_COOKIE, safeEquals } from "../auth/session";
import { HttpError } from "../auth/guards";
import { env } from "../env";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function originOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function assertSameOrigin(request: Request): void {
  if (SAFE_METHODS.has(request.method)) return;

  const expected = new URL(env.APP_URL).origin;
  const origin = originOf(request.headers.get("origin")) ?? originOf(request.headers.get("referer"));

  if (!origin) {
    throw new HttpError(403, "Request is missing an Origin header.", "bad_origin");
  }
  if (origin !== expected) {
    throw new HttpError(403, "Request came from an unexpected origin.", "bad_origin");
  }
}

export function assertCsrfToken(request: Request): void {
  if (SAFE_METHODS.has(request.method)) return;

  const header = request.headers.get("x-csrf-token");
  const cookie = readCookie(request.headers.get("cookie"), CSRF_COOKIE);

  if (!header || !cookie || !safeEquals(header, cookie)) {
    throw new HttpError(403, "Your session token is missing or stale. Reload the page and try again.", "bad_csrf");
  }
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}
