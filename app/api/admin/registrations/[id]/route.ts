import { requireOfficerApi } from "@/lib/auth/guards";
import { jsonOk, readJson, readParams, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { updateRegistrationAsOfficer } from "@/lib/services/registrations";
import { idSchema, updateRegistrationSchema } from "@/lib/validation/schemas";

export const PATCH = withApi(async (request, context) => {
  const actor = await requireOfficerApi();
  const id = idSchema.parse((await readParams(context)).id);
  const input = await readJson(request, updateRegistrationSchema);

  const registration = await updateRegistrationAsOfficer(id, input);

  const feeNote = input.feePaid !== undefined ? ` and marked the entry fee ${input.feePaid ? "paid" : "unpaid"}` : "";

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.REGISTRATION_UPDATED,
    targetType: "registration",
    targetId: id,
    summary: `${actor.displayName} set ${registration.user.displayName}'s ${registration.tournament.name} entry to ${input.status}${feeNote}`,
    metadata: { status: input.status, feePaid: input.feePaid },
  });

  return jsonOk({ id: registration.id, status: registration.status, feePaid: registration.feePaid });
});
