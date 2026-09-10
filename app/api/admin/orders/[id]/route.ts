import { requireOfficerApi } from "@/lib/auth/guards";
import { jsonOk, readJson, readParams, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { updateOrderAsOfficer } from "@/lib/services/orders";
import { idSchema, updateOrderSchema } from "@/lib/validation/schemas";

export const PATCH = withApi(async (request, context) => {
  const actor = await requireOfficerApi();
  const id = idSchema.parse((await readParams(context)).id);
  const input = await readJson(request, updateOrderSchema);

  const order = await updateOrderAsOfficer(id, input);

  const paidNote = input.paid !== undefined ? ` and marked it ${input.paid ? "paid" : "unpaid"}` : "";

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.ORDER_UPDATED,
    targetType: "order",
    targetId: id,
    summary: `${actor.displayName} set ${order.user.displayName}'s ${order.item.name} order to ${input.status}${paidNote}`,
    metadata: { status: input.status, paid: input.paid },
  });

  return jsonOk({ id: order.id, status: order.status, paid: order.paid });
});
