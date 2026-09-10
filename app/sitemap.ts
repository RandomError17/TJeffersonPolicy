import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { listPublishedNews } from "@/lib/services/news";

/** Regenerated hourly so newly published posts appear without a redeploy. */
export const revalidate = 3600;

/** Public pages only. Nothing behind sign-in is ever listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.APP_URL.replace(/\/$/, "");

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/officers`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/achievements`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/news`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/join`, changeFrequency: "monthly", priority: 0.9 },
  ];

  let posts: MetadataRoute.Sitemap = [];
  try {
    const published = await listPublishedNews();
    posts = published.map((post) => ({
      url: `${base}/news/${post.slug}`,
      lastModified: post.publishedAt ?? undefined,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    }));
  } catch {
    // A database hiccup should degrade the sitemap, not break the build.
  }

  return [...staticPages, ...posts];
}
