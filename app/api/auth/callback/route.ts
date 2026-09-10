/**
 * Provider callback.
 *
 * Validates `state` against the stored AuthRequest (single use), exchanges the
 * code for a profile, provisions or refreshes the local account, and starts a
 * session. Failures redirect back to /signin with a short reason code rather
 * than rendering a raw error.
 */
import { NextResponse } from "next/server";
import { AuthError, authProvider, callbackUrl } from "@/lib/auth";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { clientKey, consume, RATE_LIMITS } from "@/lib/http/rate-limit";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { upsertUserFromProfile } from "@/lib/services/users";

function failure(reason: string) {
  return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(reason)}`, env.APP_URL), { status: 302 });
}

export async function GET(request: Request) {
  try {
    consume(clientKey(request, "auth-callback"), RATE_LIMITS.auth);
  } catch {
    return failure("rate_limited");
  }

  const url = new URL(request.url);

  // The provider reports its own refusals here (e.g. the user pressed Deny).
  if (url.searchParams.get("error")) return failure("denied");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return failure("invalid_request");

  // Consume the state exactly once, regardless of what happens next.
  const authRequest = await prisma.authRequest.findUnique({ where: { state } });
  if (authRequest) await prisma.authRequest.delete({ where: { id: authRequest.id } }).catch(() => {});

  if (!authRequest || authRequest.expiresAt.getTime() <= Date.now()) {
    return failure("expired");
  }

  try {
    const profile = await authProvider().completeAuthorization({
      code,
      redirectUri: callbackUrl(),
      codeVerifier: authRequest.codeVerifier,
    });

    const { user, created } = await upsertUserFromProfile(profile);

    await createSession(user.id, {
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });

    await recordAudit({
      actor: user,
      action: AUDIT_ACTIONS.SIGN_IN,
      targetType: "user",
      targetId: user.id,
      summary: created ? `${user.displayName} signed in for the first time` : `${user.displayName} signed in`,
      metadata: { provider: authProvider().id, created },
    });

    const destination = authRequest.redirectTo?.startsWith("/") ? authRequest.redirectTo : "/portal";
    return NextResponse.redirect(new URL(destination, env.APP_URL), { status: 302 });
  } catch (error) {
    if (error instanceof AuthError) return failure(error.code);
    console.error("[auth] callback failed", error);
    return failure("provider_error");
  }
}
