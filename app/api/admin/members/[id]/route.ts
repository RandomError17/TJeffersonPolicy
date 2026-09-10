/**
 * Officer edits to a member record.
 *
 * Guards worth noting:
 *  - Demoting the last officer is refused, so nobody can lock the team out.
 *  - Demoting someone pinned by OFFICER_USERNAMES is refused too: their role
 *    would be restored at their next sign-in, and a change that silently
 *    reverts is worse than one that is declined with a reason.
 *  - A role change ends that user's sessions, so a demotion takes effect in
 *    every browser immediately rather than at their next sign-in.
 *  - Deleting the last officer is refused for the same reason as demoting one.
 *  - An officer cannot delete their own account here — that would end their
 *    own session mid-request. They can be removed by another officer instead.
 */
import { HttpError, requireOfficerApi } from "@/lib/auth/guards";
import { destroyAllSessionsForUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { jsonOk, readJson, readParams, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { deleteMember, isListedOfficer, officerCount, updateMemberAsOfficer } from "@/lib/services/users";
import { idSchema, updateMemberSchema } from "@/lib/validation/schemas";

export const PATCH = withApi(async (request, context) => {
  const actor = await requireOfficerApi();
  const { id } = await readParams(context);
  const userId = idSchema.parse(id);
  const input = await readJson(request, updateMemberSchema);

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new HttpError(404, "That member no longer exists.", "not_found");

  const demoting = input.role === "MEMBER" && target.role === "OFFICER";

  if (demoting && isListedOfficer(target.ionUsername)) {
    throw new HttpError(
      409,
      `${target.displayName} is listed in the OFFICER_USERNAMES setting, so their officer role would come back at their next sign-in. Remove "${target.ionUsername}" from that setting first.`,
      "config_pinned_officer",
    );
  }

  if (demoting && (await officerCount()) <= 1) {
    throw new HttpError(409, "You cannot remove the last officer. Promote someone else first.", "last_officer");
  }

  const updated = await updateMemberAsOfficer(userId, input);

  if (input.role && input.role !== target.role) {
    await destroyAllSessionsForUser(userId);
    await recordAudit({
      actor,
      action: AUDIT_ACTIONS.MEMBER_ROLE_CHANGED,
      targetType: "user",
      targetId: userId,
      summary: `${actor.displayName} changed ${target.displayName}'s role from ${target.role} to ${input.role}`,
      metadata: { from: target.role, to: input.role },
    });
  }

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.MEMBER_UPDATED,
    targetType: "user",
    targetId: userId,
    summary: `${actor.displayName} updated ${target.displayName}'s member record`,
    metadata: { fields: Object.keys(input) },
  });

  return jsonOk({ id: updated.id, role: updated.role, status: updated.status });
});

export const DELETE = withApi(async (_request, context) => {
  const actor = await requireOfficerApi();
  const { id } = await readParams(context);
  const userId = idSchema.parse(id);

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new HttpError(404, "That member no longer exists.", "not_found");

  if (target.id === actor.id) {
    throw new HttpError(409, "You cannot delete your own account. Ask another officer to remove it.", "self_delete");
  }

  if (target.role === "OFFICER" && (await officerCount()) <= 1) {
    throw new HttpError(409, "You cannot remove the last officer. Promote someone else first.", "last_officer");
  }

  // Record the audit entry before the row is gone — targetId is kept for the
  // log, but there is no longer a user row for it to reference.
  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.MEMBER_DELETED,
    targetType: "user",
    targetId: userId,
    summary: `${actor.displayName} deleted the member record for ${target.displayName} (${target.ionUsername})`,
    metadata: { ionUsername: target.ionUsername, role: target.role },
  });

  await deleteMember(userId);

  return jsonOk({ deleted: true });
});
