import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/** Reads APP_URL at request time so one build can serve several environments. */
export const dynamic = "force-dynamic";

/**
 * Everything behind sign-in is disallowed here as well as being marked
 * noindex in each layout's metadata — a crawler that ignores one should still
 * be stopped by the other.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal", "/portal/", "/admin", "/admin/", "/api/", "/auth/", "/signin"],
    },
    sitemap: new URL("/sitemap.xml", env.APP_URL).toString(),
  };
}
