import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import { Analytics } from "@/components/analytics/Analytics";
import { CLUB } from "@/lib/content/club";
import { siteOrigin } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Heavy grotesque for display type. Constructivist posters are set in dense,
 * industrial sans faces — a high-contrast serif would read as editorial
 * luxury, which is the opposite of what this identity is after.
 */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  weight: ["600", "700", "800"],
});

const SITE_DESCRIPTION =
  "Policy Debate at Thomas Jefferson High School for Science and Technology. Varsity and novice squads competing on the local, state, and national circuits.";

export const metadata: Metadata = {
  /**
   * Makes every relative `alternates.canonical` and `openGraph.url` in the
   * app resolve to an absolute URL. Without it Next emits relative canonical
   * tags, which crawlers treat inconsistently.
   */
  metadataBase: new URL(siteOrigin()),
  title: {
    default: `${CLUB.shortName} — ${CLUB.school}`,
    template: `%s · ${CLUB.shortName}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: CLUB.shortName,
  alternates: { canonical: "/" },
  // Icons come from the app/icon.svg, app/apple-icon.tsx and app/favicon.ico
  // file conventions; declaring them here as well would emit duplicate tags.
  openGraph: {
    title: `${CLUB.shortName} — ${CLUB.school}`,
    description: SITE_DESCRIPTION,
    siteName: CLUB.shortName,
    locale: "en_US",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${CLUB.shortName} — ${CLUB.school}`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    // Member and officer areas are excluded in app/robots.ts as well.
  },
};

export const viewport: Viewport = {
  themeColor: "#274690",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable}`}>
      <head>
        {/*
          Scroll-reveal sections are hidden until JavaScript observes them.
          Without this, a visitor with scripting disabled would see empty
          sections rather than a page that simply does not animate.
        */}
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[100] focus:bg-signal focus:px-6 focus:py-4 focus:font-display focus:text-sm focus:font-bold focus:uppercase focus:tracking-widest focus:text-ink"
        >
          Skip to main content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
