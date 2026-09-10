import { requireOfficerApi } from "@/lib/auth/guards";
import { jsonOk, readJson, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { saveResource } from "@/lib/services/resources";
import { resourceSchema } from "@/lib/validation/schemas";

export const POST = withApi(async (request) => {
  const actor = await requireOfficerApi();
  const input = await readJson(request, resourceSchema);

  const resource = await saveResource({ ...input, addedById: actor.id });

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.RESOURCE_SAVED,
    targetType: "resource",
    targetId: resource.id,
    summary: `${actor.displayName} added the resource "${resource.title}"`,
    metadata: { visibility: resource.visibility, category: resource.category },
  });

  return jsonOk({ id: resource.id }, 201);
});
