/**
 * Sign out. POST only, CSRF-checked, so a third-party page cannot force it.
 */
import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";

export const POST = withApi(async () => {
  const session = await getSession();
  if (session) {
    await recordAudit({
      actor: session.user,
      action: AUDIT_ACTIONS.SIGN_OUT,
      targetType: "user",
      targetId: session.user.id,
      summary: `${session.user.displayName} signed out`,
    });
  }
  await destroySession();
  return NextResponse.json({ ok: true, redirectTo: new URL("/", env.APP_URL).pathname });
});
