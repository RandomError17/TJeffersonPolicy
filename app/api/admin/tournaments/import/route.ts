/**
 * Read-only Tabroom metadata lookup.
 *
 * Returns normalised fields for the officer to review and edit before saving —
 * nothing is written to the database by this endpoint. See
 * lib/integrations/tabroom.ts for the scope and limits of the integration.
 */
import { requireOfficerApi } from "@/lib/auth/guards";
import { jsonOk, readJson, withApi } from "@/lib/http/api";
import { RATE_LIMITS } from "@/lib/http/rate-limit";
import { fetchTournament, parseTabroomReference } from "@/lib/integrations/tabroom";
import { tabroomImportSchema } from "@/lib/validation/schemas";

export const POST = withApi(
  async (request) => {
    await requireOfficerApi();
    const { reference } = await readJson(request, tabroomImportSchema);

    const tabroomId = parseTabroomReference(reference);
    const metadata = await fetchTournament(tabroomId);

    return jsonOk(metadata);
  },
  { rateLimit: RATE_LIMITS.external, rateLimitScope: "tabroom-import" },
);
