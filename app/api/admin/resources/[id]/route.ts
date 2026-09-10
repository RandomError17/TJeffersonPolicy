import { HttpError, requireOfficerApi } from "@/lib/auth/guards";
import { jsonOk, readJson, readParams, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { deleteResource, getResource, saveResource } from "@/lib/services/resources";
import { idSchema, resourceSchema } from "@/lib/validation/schemas";

export const PATCH = withApi(async (request, context) => {
  const actor = await requireOfficerApi();
  const id = idSchema.parse((await readParams(context)).id);
  const input = await readJson(request, resourceSchema);

  if (!(await getResource(id))) throw new HttpError(404, "That resource no longer exists.", "not_found");

  const resource = await saveResource({ id, ...input, addedById: actor.id });

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.RESOURCE_SAVED,
    targetType: "resource",
    targetId: id,
    summary: `${actor.displayName} updated the resource "${resource.title}"`,
  });

  return jsonOk({ id: resource.id });
});

export const DELETE = withApi(async (_request, context) => {
  const actor = await requireOfficerApi();
  const id = idSchema.parse((await readParams(context)).id);

  const existing = await getResource(id);
  if (!existing) throw new HttpError(404, "That resource no longer exists.", "not_found");

  await deleteResource(id);

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.RESOURCE_DELETED,
    targetType: "resource",
    targetId: id,
    summary: `${actor.displayName} deleted the resource "${existing.title}"`,
  });

  return jsonOk({ deleted: true });
});
