import { HttpError, requireOfficerApi } from "@/lib/auth/guards";
import { destroyAllSessionsForUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { jsonOk, readParams, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { removeOfficerProfile } from "@/lib/services/officers";
import { isListedOfficer, officerCount } from "@/lib/services/users";
import { idSchema } from "@/lib/validation/schemas";

/**
 * Remove someone from the public officer roster. `?demote=1` also drops their
 * OFFICER role — refused if they are the last officer.
 */
export const DELETE = withApi(async (request, context) => {
  const actor = await requireOfficerApi();
  const userId = idSchema.parse((await readParams(context)).userId);
  const demote = new URL(request.url).searchParams.get("demote") === "1";

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true, role: true, ionUsername: true },
  });
  if (!target) throw new HttpError(404, "That member no longer exists.", "not_found");

  // Removing the public profile is always fine; revoking access is not, when
  // configuration would hand it straight back at the next sign-in.
  if (demote && isListedOfficer(target.ionUsername)) {
    throw new HttpError(
      409,
      `${target.displayName} is listed in the OFFICER_USERNAMES setting, so their access would come back at their next sign-in. Remove "${target.ionUsername}" from that setting first, or use "Remove from page only".`,
      "config_pinned_officer",
    );
  }

  if (demote && target.role === "OFFICER" && (await officerCount()) <= 1) {
    throw new HttpError(409, "You cannot remove the last officer. Promote someone else first.", "last_officer");
  }

  await removeOfficerProfile(userId, { demote });
  if (demote) await destroyAllSessionsForUser(userId);

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.OFFICER_REMOVED,
    targetType: "officer",
    targetId: userId,
    summary: demote
      ? `${actor.displayName} removed ${target.displayName} from the officer team and revoked officer access`
      : `${actor.displayName} removed ${target.displayName} from the public officer roster`,
    metadata: { demote },
  });

  return jsonOk({ removed: true, demoted: demote });
});
