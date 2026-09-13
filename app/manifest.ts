import type { MetadataRoute } from "next";
import { CLUB } from "@/lib/content/club";

/**
 * Web app manifest.
 *
 * Present so the site installs sensibly when a member adds it to a phone home
 * screen — the portal is the part people actually revisit on a phone. It is
 * not a full PWA: there is no service worker and nothing works offline, which
 * is the right call for a site whose every page is account-specific and
 * database-backed.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${CLUB.shortName} — ${CLUB.school}`,
    short_name: CLUB.shortName,
    description:
      "Policy Debate at Thomas Jefferson High School for Science and Technology. Tournament registration, dues, and team resources for members.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1eee4",
    theme_color: "#0d1735",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
