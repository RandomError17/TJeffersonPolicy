import { requireOfficerApi } from "@/lib/auth/guards";
import { jsonOk, readJson, withApi } from "@/lib/http/api";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/services/audit";
import { saveOrderItem } from "@/lib/services/orders";
import { orderItemSchema } from "@/lib/validation/schemas";

export const POST = withApi(async (request) => {
  const actor = await requireOfficerApi();
  const input = await readJson(request, orderItemSchema);

  const item = await saveOrderItem(input);

  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.ORDER_ITEM_SAVED,
    targetType: "order_item",
    targetId: item.id,
    summary: `${actor.displayName} created the catalogue item "${item.name}"`,
  });

  return jsonOk({ id: item.id, slug: item.slug }, 201);
});
