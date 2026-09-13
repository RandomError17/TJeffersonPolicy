/**
 * schema.org structured data.
 *
 * Everything here is built from facts the site already states on the page.
 * Structured data that contradicts the visible page is treated as spam by
 * search engines, and inventing figures would be worse than emitting nothing —
 * so there are no ratings, no member counts, and no award claims in these
 * shapes unless the database actually holds them.
 */
import { CLUB, SOCIALS } from "./content/club";
import { absoluteUrl } from "./seo";

/**
 * The club itself. `SportsOrganization` is the closest fit schema.org offers
 * for a competitive scholastic team; the parent school is linked rather than
 * claimed as the publisher.
 */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "@id": absoluteUrl("/#organization"),
    name: CLUB.shortName,
    alternateName: "Jefferson Policy Debate",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/logo.png"),
    email: CLUB.email,
    sport: "Policy Debate",
    parentOrganization: {
      "@type": "HighSchool",
      name: CLUB.school,
      address: {
        "@type": "PostalAddress",
        streetAddress: CLUB.addressLine1,
        addressLocality: "Alexandria",
        addressRegion: "VA",
        postalCode: "22312",
        addressCountry: "US",
      },
    },
    sameAs: [SOCIALS.instagram.url, SOCIALS.facebook.url, SOCIALS.discord.url],
  };
}

/** Lets a search engine show the site name rather than the bare domain. */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: absoluteUrl("/"),
    name: CLUB.shortName,
    publisher: { "@id": absoluteUrl("/#organization") },
    inLanguage: "en-US",
  };
}

/**
 * Trail for a subpage. Passed as [label, path] pairs; the home crumb is added
 * here so no caller can forget it.
 */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** A published announcement or result write-up. */
export function newsArticleSchema(post: {
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: Date | null;
  updatedAt?: Date | null;
  authorName?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title.slice(0, 110),
    ...(post.excerpt ? { description: post.excerpt } : {}),
    url: absoluteUrl(`/news/${post.slug}`),
    mainEntityOfPage: absoluteUrl(`/news/${post.slug}`),
    ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
    ...(post.updatedAt ? { dateModified: post.updatedAt.toISOString() } : {}),
    author: post.authorName
      ? { "@type": "Person", name: post.authorName }
      : { "@id": absoluteUrl("/#organization") },
    publisher: { "@id": absoluteUrl("/#organization") },
  };
}

/** The join page's question list, so it can surface as an FAQ result. */
export function faqSchema(items: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
