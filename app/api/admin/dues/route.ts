/**
 * Season-level dues waiver.
 *
 * This is the only thing about a member's balance an officer sets directly —
 * everything else is derived from checking off individual registrations and
 * orders on the member's profile. See lib/services/dues.ts.
 */
import { requireOfficerApi } from "@/lib/auth/guards";
import { jsonOk, readJson, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { setDuesWaiver } from "@/lib/services/dues";
import { setDuesWaiverSchema } from "@/lib/validation/schemas";

export const PUT = withApi(async (request) => {
  const actor = await requireOfficerApi();
  const input = await readJson(request, setDuesWaiverSchema);

  const record = await setDuesWaiver({ ...input, updatedById: actor.id });

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.DUES_UPDATED,
    targetType: "dues",
    targetId: record.id,
    summary: input.waived
      ? `${actor.displayName} waived ${record.user.displayName}'s ${input.seasonYear} dues`
      : `${actor.displayName} removed ${record.user.displayName}'s ${input.seasonYear} dues waiver`,
    metadata: { waived: input.waived, seasonYear: input.seasonYear },
  });

  return jsonOk({ id: record.id, waived: record.waived });
});
