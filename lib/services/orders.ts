/**
 * Apparel, merchandise, and membership orders.
 *
 * Like dues, this is a tracking layer only: members are sent to MySchoolBucks
 * or the NSDA to pay, and officers record fulfilment state here.
 */
import { prisma } from "../db";
import { HttpError } from "../auth/guards";
import { parseStringList, serializeStringList } from "../json";
import { uniqueSlug } from "../utils/slug";

export async function listActiveItems() {
  return prisma.orderItem.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function listAllItems() {
  return prisma.orderItem.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function listOwnOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    select: {
      id: true,
      quantity: true,
      size: true,
      status: true,
      memberNote: true,
      createdAt: true,
      updatedAt: true,
      item: { select: { id: true, name: true, category: true, priceCents: true, externalUrl: true, externalLabel: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOrder(input: {
  userId: string;
  itemId: string;
  quantity: number;
  size?: string;
  memberNote?: string;
}) {
  const item = await prisma.orderItem.findUnique({ where: { id: input.itemId } });
  if (!item || !item.isActive) throw new HttpError(404, "That item is not available.", "not_found");

  const sizes = parseStringList(item.sizes);
  if (sizes.length > 0 && (!input.size || !sizes.includes(input.size))) {
    throw new HttpError(422, "Choose one of the available sizes.", "invalid_size");
  }
  if (sizes.length === 0 && input.size) {
    throw new HttpError(422, "That item does not have size options.", "invalid_size");
  }

  return prisma.order.create({
    data: {
      userId: input.userId,
      itemId: input.itemId,
      quantity: input.quantity,
      size: input.size ?? null,
      memberNote: input.memberNote ?? null,
    },
    include: { item: true },
  });
}

export async function listOrdersForOfficers(filters: { status?: string; itemId?: string } = {}) {
  return prisma.order.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.itemId ? { itemId: filters.itemId } : {}),
    },
    include: { user: { select: { id: true, displayName: true, gradeNumber: true } }, item: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateOrderAsOfficer(
  orderId: string,
  data: { status: string; officerNote?: string; paid?: boolean },
) {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: data.status,
      officerNote: data.officerNote ?? null,
      ...(data.paid !== undefined ? { paid: data.paid } : {}),
    },
    include: { item: true, user: { select: { displayName: true } } },
  });
}

export async function saveOrderItem(input: {
  id?: string;
  name: string;
  description?: string;
  priceCents?: number;
  category: string;
  externalUrl?: string;
  externalLabel?: string;
  sizes: string[];
  isActive: boolean;
  sortOrder: number;
}) {
  const data = {
    name: input.name,
    description: input.description ?? null,
    priceCents: input.priceCents ?? null,
    category: input.category,
    externalUrl: input.externalUrl ?? null,
    externalLabel: input.externalLabel ?? null,
    sizes: serializeStringList(input.sizes),
    isActive: input.isActive,
    sortOrder: input.sortOrder,
  };

  if (input.id) return prisma.orderItem.update({ where: { id: input.id }, data });

  const slug = await uniqueSlug(input.name, async (candidate) =>
    Boolean(await prisma.orderItem.findUnique({ where: { slug: candidate }, select: { id: true } })),
  );
  return prisma.orderItem.create({ data: { ...data, slug } });
}

/**
 * Permanently remove a catalog item, or archive it if that would orphan order
 * history. Mirrors deleteTournamentIfEmpty in lib/services/tournaments.ts.
 */
export async function deleteOrderItem(id: string): Promise<{ deleted: boolean; archived: boolean }> {
  const count = await prisma.order.count({ where: { itemId: id } });

  if (count > 0) {
    await prisma.orderItem.update({ where: { id }, data: { isActive: false } });
    return { deleted: false, archived: true };
  }

  await prisma.orderItem.delete({ where: { id } });
  return { deleted: true, archived: false };
}

export function ordersToCsv(
  rows: { user: { displayName: string }; item: { name: string }; quantity: number; size: string | null; status: string; createdAt: Date }[],
): string {
  const header = ["Member", "Item", "Quantity", "Size", "Status", "Ordered at"];
  const lines = rows.map((row) =>
    [row.user.displayName, row.item.name, String(row.quantity), row.size ?? "", row.status, row.createdAt.toISOString()]
      .map((cell) => `"${(/^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.map((h) => `"${h}"`).join(","), ...lines].join("\r\n");
}
