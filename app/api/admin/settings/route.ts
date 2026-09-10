import { requireOfficerApi } from "@/lib/auth/guards";
import { jsonOk, readJson, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { updateSettings } from "@/lib/services/settings";
import { clubSettingsSchema } from "@/lib/validation/schemas";

export const PUT = withApi(async (request) => {
  const actor = await requireOfficerApi();
  const { settings } = await readJson(request, clubSettingsSchema);

  // Unknown keys are dropped by updateSettings; only the allowlist is written.
  const changed = await updateSettings(settings);

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.SETTINGS_UPDATED,
    targetType: "settings",
    summary: `${actor.displayName} updated club settings (${changed.join(", ") || "no changes"})`,
    metadata: { keys: changed },
  });

  return jsonOk({ changed });
});
