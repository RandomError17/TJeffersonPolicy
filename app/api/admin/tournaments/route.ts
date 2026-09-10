import { requireOfficerApi } from "@/lib/auth/guards";
import { jsonOk, readJson, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { createTournament } from "@/lib/services/tournaments";
import { tournamentSchema } from "@/lib/validation/schemas";

export const POST = withApi(async (request) => {
  const actor = await requireOfficerApi();
  const input = await readJson(request, tournamentSchema);

  const tournament = await createTournament(input, actor.id);

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.TOURNAMENT_CREATED,
    targetType: "tournament",
    targetId: tournament.id,
    summary: `${actor.displayName} created the tournament "${tournament.name}"`,
    metadata: { divisions: tournament.divisions.length, status: tournament.status },
  });

  return jsonOk({ id: tournament.id, slug: tournament.slug }, 201);
});
