import { HttpError, requireOfficerApi } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { jsonOk, readJson, readParams, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { deleteOrderItem, saveOrderItem } from "@/lib/services/orders";
import { idSchema, orderItemSchema } from "@/lib/validation/schemas";

export const PATCH = withApi(async (request, context) => {
  const actor = await requireOfficerApi();
  const id = idSchema.parse((await readParams(context)).id);
  const input = await readJson(request, orderItemSchema);

  const item = await saveOrderItem({ id, ...input });

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.ORDER_ITEM_SAVED,
    targetType: "order_item",
    targetId: item.id,
    summary: `${actor.displayName} updated the catalogue item "${item.name}"`,
  });

  return jsonOk({ id: item.id });
});

/**
 * Permanently remove a catalog item, or archive it if orders reference it —
 * mirrors the tournament delete/archive endpoint.
 */
export const DELETE = withApi(async (_request, context) => {
  const actor = await requireOfficerApi();
  const id = idSchema.parse((await readParams(context)).id);

  const existing = await prisma.orderItem.findUnique({ where: { id }, select: { name: true } });
  if (!existing) throw new HttpError(404, "That item no longer exists.", "not_found");

  const result = await deleteOrderItem(id);

  await recordAudit({
    actor,
    action: result.deleted ? AUDIT_ACTIONS.ORDER_ITEM_DELETED : AUDIT_ACTIONS.ORDER_ITEM_ARCHIVED,
    targetType: "order_item",
    targetId: id,
    summary: result.deleted
      ? `${actor.displayName} deleted the catalogue item "${existing.name}"`
      : `${actor.displayName} archived "${existing.name}" (it had orders, so it was not deleted)`,
  });

  return jsonOk(result);
});
