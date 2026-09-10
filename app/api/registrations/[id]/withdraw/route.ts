/**
 * Withdraw from a tournament. Members may withdraw their own entry; officers
 * may withdraw anyone's. Enforced inside the service, not by the caller.
 */
import { isOfficer, requireUserApi } from "@/lib/auth/guards";
import { jsonOk, readParams, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { withdrawRegistration } from "@/lib/services/registrations";
import { idSchema } from "@/lib/validation/schemas";

export const POST = withApi(async (_request, context) => {
  const user = await requireUserApi();
  const { id } = await readParams(context);

  const registration = await withdrawRegistration(idSchema.parse(id), user.id, isOfficer(user));

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.REGISTRATION_WITHDRAWN,
    targetType: "registration",
    targetId: registration.id,
    summary: `${user.displayName} withdrew a registration for ${registration.tournament.name} (${registration.division.name})`,
  });

  return jsonOk({ id: registration.id, deleted: true });
});
