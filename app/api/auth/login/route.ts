/**
 * Begin sign-in.
 *
 * Creates a short-lived AuthRequest holding the OAuth `state` and the PKCE
 * verifier, then redirects to the provider. The verifier never reaches the
 * browser, and `state` is single-use — the callback deletes the row whether or
 * not the exchange succeeds.
 */
import { NextResponse } from "next/server";
import { authProvider, callbackUrl } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { toErrorResponse } from "@/lib/http/api";
import { clientKey, consume, RATE_LIMITS } from "@/lib/http/rate-limit";

const STATE_TTL_MS = 10 * 60 * 1000;

/** Only same-site paths may be used as a post-sign-in destination. */
function safeRedirect(raw: string | null): string {
  if (!raw) return "/portal";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/portal";
  return raw;
}

export async function GET(request: Request) {
  try {
    consume(clientKey(request, "auth-login"), RATE_LIMITS.auth);

    const url = new URL(request.url);
    const redirectTo = safeRedirect(url.searchParams.get("next"));

    const provider = authProvider();
    const authorization = await provider.createAuthorizationRequest(callbackUrl());

    await prisma.authRequest.create({
      data: {
        state: authorization.state,
        codeVerifier: authorization.codeVerifier,
        nonce: authorization.nonce,
        redirectTo,
        expiresAt: new Date(Date.now() + STATE_TTL_MS),
      },
    });

    // Opportunistic cleanup; the table is tiny and this keeps it that way.
    await prisma.authRequest.deleteMany({ where: { expiresAt: { lte: new Date() } } }).catch(() => {});

    const target = authorization.url.startsWith("/")
      ? new URL(authorization.url, env.APP_URL).toString()
      : authorization.url;

    return NextResponse.redirect(target, { status: 302 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
