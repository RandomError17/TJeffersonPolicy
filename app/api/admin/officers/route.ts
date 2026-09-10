/**
 * Create or update a public officer profile.
 *
 * Saving a profile also grants the OFFICER role — the two were otherwise easy
 * to leave out of step, which would show someone publicly as an officer while
 * they could not reach the dashboard.
 */
import { HttpError, requireOfficerApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { jsonOk, readJson, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { saveOfficerProfile } from "@/lib/services/officers";
import { officerProfileSchema } from "@/lib/validation/schemas";

export const POST = withApi(async (request) => {
  const actor = await requireOfficerApi();
  const input = await readJson(request, officerProfileSchema);

  const target = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true, displayName: true } });
  if (!target) throw new HttpError(404, "That member no longer exists.", "not_found");

  const profile = await saveOfficerProfile(input);

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.OFFICER_SAVED,
    targetType: "officer",
    targetId: profile.id,
    summary: `${actor.displayName} saved ${target.displayName} as ${input.position} for ${input.termYear}`,
    metadata: { position: input.position, termYear: input.termYear, isPublic: input.isPublic },
  });

  return jsonOk({ id: profile.id });
});
