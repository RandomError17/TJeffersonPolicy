/**
 * CSV export of registrations, optionally scoped to one tournament.
 *
 * GET with no body, so it can be a plain link; officer-only, and the response
 * is marked no-store so it does not linger in a shared cache.
 */
import { requireOfficerApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/http/api";
import { listRegistrationsForOfficers, registrationsToCsv } from "@/lib/services/registrations";

export async function GET(request: Request) {
  try {
    await requireOfficerApi();

    const url = new URL(request.url);
    const tournamentId = url.searchParams.get("tournamentId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;

    const rows = await listRegistrationsForOfficers({ tournamentId, status });
    const csv = registrationsToCsv(rows);
    const stamp = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="registrations-${stamp}.csv"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
