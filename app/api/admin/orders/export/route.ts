import { requireOfficerApi } from "@/lib/auth/guards";
import { toErrorResponse } from "@/lib/http/api";
import { listOrdersForOfficers, ordersToCsv } from "@/lib/services/orders";

export async function GET(request: Request) {
  try {
    await requireOfficerApi();

    const url = new URL(request.url);
    const rows = await listOrdersForOfficers({
      status: url.searchParams.get("status") ?? undefined,
      itemId: url.searchParams.get("itemId") ?? undefined,
    });

    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(ordersToCsv(rows), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="orders-${stamp}.csv"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
