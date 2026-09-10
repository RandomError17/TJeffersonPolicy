/**
 * Member resource library.
 *
 * Resources are never public. `visibility` adds a second tier so officers can
 * keep strategy notes off the general member list; the filter is applied in
 * the query, not in the component.
 */
import { prisma } from "../db";
import { parseStringList, serializeStringList } from "../json";

export async function listResourcesForUser(options: { isOfficer: boolean; category?: string; search?: string }) {
  const visibility = options.isOfficer ? undefined : "MEMBER";

  const resources = await prisma.resource.findMany({
    where: {
      ...(visibility ? { visibility } : {}),
      ...(options.category ? { category: options.category } : {}),
      ...(options.search
        ? {
            OR: [
              { title: { contains: options.search } },
              { description: { contains: options.search } },
              { tags: { contains: options.search } },
            ],
          }
        : {}),
    },
    include: { addedBy: { select: { displayName: true } } },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
  });

  return resources;
}

export async function getResource(id: string) {
  return prisma.resource.findUnique({ where: { id } });
}

export async function saveResource(input: {
  id?: string;
  title: string;
  description?: string;
  category: string;
  url: string;
  tags: string[];
  visibility: string;
  addedById: string;
}) {
  const data = {
    title: input.title,
    description: input.description ?? null,
    category: input.category,
    url: input.url,
    tags: serializeStringList(input.tags),
    visibility: input.visibility,
  };
  return input.id
    ? prisma.resource.update({ where: { id: input.id }, data })
    : prisma.resource.create({ data: { ...data, addedById: input.addedById } });
}

export async function deleteResource(id: string) {
  return prisma.resource.delete({ where: { id } });
}

export function resourceTags(resource: { tags: string }): string[] {
  return parseStringList(resource.tags);
}
