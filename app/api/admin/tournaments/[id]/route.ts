import { HttpError, requireOfficerApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { jsonOk, readJson, readParams, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { archiveTournament, deleteTournamentIfEmpty, updateTournament } from "@/lib/services/tournaments";
import { idSchema, tournamentSchema } from "@/lib/validation/schemas";

export const PATCH = withApi(async (request, context) => {
  const actor = await requireOfficerApi();
  const id = idSchema.parse((await readParams(context)).id);
  const input = await readJson(request, tournamentSchema);

  const existing = await prisma.tournament.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!existing) throw new HttpError(404, "That tournament no longer exists.", "not_found");

  const { tournament, keptDivisions } = await updateTournament(id, input);

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.TOURNAMENT_UPDATED,
    targetType: "tournament",
    targetId: id,
    summary: `${actor.displayName} updated the tournament "${tournament.name}"`,
    metadata: { keptDivisions },
  });

  return jsonOk({
    id: tournament.id,
    // Surfaced so the UI can explain why a removed event is still listed.
    keptDivisions,
  });
});

/**
 * Hard delete is only allowed while nothing is registered; otherwise the
 * caller is told to archive instead, which preserves member history.
 */
export const DELETE = withApi(async (_request, context) => {
  const actor = await requireOfficerApi();
  const id = idSchema.parse((await readParams(context)).id);

  const existing = await prisma.tournament.findUnique({ where: { id }, select: { name: true } });
  if (!existing) throw new HttpError(404, "That tournament no longer exists.", "not_found");

  const deleted = await deleteTournamentIfEmpty(id);

  if (!deleted) {
    await archiveTournament(id);
    await recordAudit({
      actor,
      action: AUDIT_ACTIONS.TOURNAMENT_ARCHIVED,
      targetType: "tournament",
      targetId: id,
      summary: `${actor.displayName} archived "${existing.name}" (it had registrations, so it was not deleted)`,
    });
    return jsonOk({ archived: true, deleted: false });
  }

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.TOURNAMENT_DELETED,
    targetType: "tournament",
    targetId: id,
    summary: `${actor.displayName} deleted the tournament "${existing.name}"`,
  });

  return jsonOk({ archived: false, deleted: true });
});
