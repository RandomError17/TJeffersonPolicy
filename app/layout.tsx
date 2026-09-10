import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import { CLUB } from "@/lib/content/club";
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

export const metadata: Metadata = {
  title: {
    default: `${CLUB.shortName} — ${CLUB.school}`,
    template: `%s · ${CLUB.shortName}`,
  },
  description:
    "Policy Debate at Thomas Jefferson High School for Science and Technology. Varsity and novice squads competing on the local, state, and national circuits.",
  applicationName: CLUB.shortName,
  icons: { icon: "/brand/logo.svg", apple: "/brand/logo.png" },
  openGraph: {
    title: `${CLUB.shortName} — ${CLUB.school}`,
    description:
      "Policy Debate at Thomas Jefferson High School for Science and Technology. Varsity and novice squads competing on the local, state, and national circuits.",
    type: "website",
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
      </body>
    </html>
  );
}
