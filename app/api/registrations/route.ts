/**
 * Member tournament registration.
 *
 * The member's identity comes from the session, never from the request body —
 * there is no userId field to forge.
 */
import { requireUserApi } from "@/lib/auth/guards";
import { jsonOk, readJson, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { createRegistration } from "@/lib/services/registrations";
import { createRegistrationSchema } from "@/lib/validation/schemas";

export const POST = withApi(async (request) => {
  const user = await requireUserApi();
  const input = await readJson(request, createRegistrationSchema);

  const registration = await createRegistration({ userId: user.id, ...input });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.REGISTRATION_CREATED,
    targetType: "registration",
    targetId: registration.id,
    summary: `${user.displayName} registered for ${registration.tournament.name} (${registration.division.name})`,
  });

  return jsonOk({ id: registration.id, status: registration.status }, 201);
});
