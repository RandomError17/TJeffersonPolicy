import { NextResponse, type NextRequest } from "next/server";

/**
 * Security headers (Next.js proxy — the successor to middleware.ts).
 *
 * Runs on every request. Two things worth explaining:
 *
 * 1. Content-Security-Policy uses a per-request nonce in production. Next
 *    picks the nonce up from the CSP header we set on the *request* and stamps
 *    it onto its own inline bootstrap scripts, which is what lets us avoid
 *    'unsafe-inline' for scripts. Development uses a relaxed policy because
 *    the dev runtime injects inline scripts a nonce cannot cover.
 *
 * 2. form-action allows ion.tjhsst.edu so the OAuth sign-in form can post
 *    there; nothing else may be a form target.
 *
 * This is defence in depth. It does not replace the escaping in
 * lib/utils/markdown.ts or the scheme allowlist in lib/validation/schemas.ts.
 */
export default function proxy(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === "production";
  const nonce = isProduction ? Buffer.from(crypto.randomUUID()).toString("base64") : null;

  const scriptSrc = nonce ? `'self' 'nonce-${nonce}' 'strict-dynamic'` : "'self' 'unsafe-inline' 'unsafe-eval'";

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    // Tailwind and next/font emit inline styles; there is no nonce path for them.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src 'self'${isProduction ? "" : " ws: http://localhost:*"}`,
    "frame-ancestors 'none'",
    "frame-src 'self'",
    "form-action 'self' https://ion.tjhsst.edu",
    "base-uri 'self'",
    "object-src 'none'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  if (nonce) requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("content-security-policy", csp);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  response.headers.set("cross-origin-opener-policy", "same-origin");

  if (isProduction) {
    response.headers.set("strict-transport-security", "max-age=63072000; includeSubDomains; preload");
  }

  // Signed-in areas must never be cached by a shared proxy.
  const path = request.nextUrl.pathname;
  if (path.startsWith("/portal") || path.startsWith("/admin") || path.startsWith("/api/")) {
    response.headers.set("cache-control", "no-store, must-revalidate");
  }

  return response;
}

export const config = {
  // Skip static assets; they need no headers and this keeps the hot path cheap.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|docs/).*)"],
};
