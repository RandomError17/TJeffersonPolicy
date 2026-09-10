/**
 * Place an order. This records intent and fulfilment state only — payment
 * happens externally (MySchoolBucks or the NSDA), and no payment data is
 * accepted by this endpoint.
 */
import { requireUserApi } from "@/lib/auth/guards";
import { jsonOk, readJson, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { createOrder } from "@/lib/services/orders";
import { createOrderSchema } from "@/lib/validation/schemas";

export const POST = withApi(async (request) => {
  const user = await requireUserApi();
  const input = await readJson(request, createOrderSchema);

  const order = await createOrder({ userId: user.id, ...input });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.ORDER_CREATED,
    targetType: "order",
    targetId: order.id,
    summary: `${user.displayName} ordered ${order.quantity} × ${order.item.name}`,
  });

  return jsonOk({ id: order.id, status: order.status }, 201);
});
