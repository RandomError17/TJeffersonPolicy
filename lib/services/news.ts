/**
 * News publishing. Drafts are visible only to officers; the public list and
 * the public post route both filter on status and publishedAt, so an unlisted
 * slug cannot be guessed into view.
 */
import { prisma } from "../db";
import { parseStringList, serializeStringList } from "../json";
import { uniqueSlug } from "../utils/slug";

const publicSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  body: true,
  imageUrl: true,
  tags: true,
  publishedAt: true,
  // Surfaced as `dateModified` in the article's structured data, so a post
  // corrected after publication is not presented as untouched since.
  updatedAt: true,
  author: { select: { displayName: true, officer: { select: { position: true } } } },
} as const;

export async function listPublishedNews(limit?: number) {
  return prisma.newsPost.findMany({
    where: { status: "PUBLISHED", publishedAt: { not: null, lte: new Date() } },
    select: publicSelect,
    orderBy: { publishedAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });
}

export async function getPublishedPost(slug: string) {
  return prisma.newsPost.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { not: null, lte: new Date() } },
    select: publicSelect,
  });
}

export async function listAllNews() {
  return prisma.newsPost.findMany({
    include: { author: { select: { displayName: true } } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getNewsPost(id: string) {
  return prisma.newsPost.findUnique({ where: { id } });
}

export async function saveNewsPost(input: {
  id?: string;
  title: string;
  excerpt: string;
  body: string;
  imageUrl?: string;
  status: string;
  tags: string[];
  authorId: string;
}) {
  const existing = input.id ? await prisma.newsPost.findUnique({ where: { id: input.id } }) : null;

  // publishedAt is stamped once, the first time a post goes live, so editing a
  // published post does not reorder the feed.
  const publishedAt =
    input.status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null);

  const data = {
    title: input.title,
    excerpt: input.excerpt,
    body: input.body,
    imageUrl: input.imageUrl ?? null,
    status: input.status,
    tags: serializeStringList(input.tags),
    publishedAt,
  };

  if (existing) return prisma.newsPost.update({ where: { id: existing.id }, data });

  const slug = await uniqueSlug(input.title, async (candidate) =>
    Boolean(await prisma.newsPost.findUnique({ where: { slug: candidate }, select: { id: true } })),
  );
  return prisma.newsPost.create({ data: { ...data, slug, authorId: input.authorId } });
}

export async function deleteNewsPost(id: string) {
  return prisma.newsPost.delete({ where: { id } });
}

export function postTags(post: { tags: string }): string[] {
  return parseStringList(post.tags);
}
