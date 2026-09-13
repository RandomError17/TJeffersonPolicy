/**
 * Metadata helpers for the public site.
 *
 * Two things every public page needs and neither of which should be retyped
 * per route:
 *
 *   1. A canonical URL. Without one, the same page reachable over
 *      www/non-www, http/https, or with a tracking query string is treated as
 *      several competing documents by a crawler.
 *   2. Open Graph and Twitter tags that agree with the page's own title and
 *      description, so a shared link does not describe something else.
 *
 * `metadataBase` is set once in app/layout.tsx, which is what lets the
 * relative paths below resolve to absolute URLs in the rendered tags.
 */
import type { Metadata } from "next";
import { CLUB } from "./content/club";
import { env } from "./env";

/** Absolute origin of this deployment, trailing slash removed. */
export function siteOrigin(): string {
  return env.APP_URL.replace(/\/$/, "");
}

export function absoluteUrl(path = "/"): string {
  return new URL(path, `${siteOrigin()}/`).toString();
}

interface PageSeo {
  title: string;
  description: string;
  /** Route path, e.g. "/about". Used for the canonical tag. */
  path: string;
  /** Overrides the site-wide Open Graph image for this route. */
  image?: string;
  /** Articles carry a published time; plain pages do not. */
  publishedTime?: Date | null;
  type?: "website" | "article";
}

/**
 * Build a page's metadata with the canonical and social tags filled in from a
 * single title/description pair, so the three can never drift apart.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  publishedTime,
  type = "website",
}: PageSeo): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} · ${CLUB.shortName}`,
      description,
      url: path,
      siteName: CLUB.shortName,
      locale: "en_US",
      type,
      ...(image ? { images: [{ url: image }] } : {}),
      ...(type === "article" && publishedTime
        ? { publishedTime: publishedTime.toISOString() }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${CLUB.shortName}`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/**
 * Metadata for a page that must never be indexed — anything behind sign-in, or
 * a route whose content is specific to one visitor. Paired with the Disallow
 * rules in app/robots.ts so a crawler ignoring one is still stopped by the
 * other.
 */
export function privateMetadata(title: string, description?: string): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
    robots: { index: false, follow: false, nocache: true },
  };
}
