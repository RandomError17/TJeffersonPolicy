import Script from "next/script";
import { headers } from "next/headers";

/**
 * Plausible analytics.
 *
 * Chosen because it sets no cookies and stores no device identifier, which
 * matters on a site whose visitors are mostly minors: there is nothing to ask
 * consent for and nothing to leak. That is also why the cookie notice in
 * components/site/CookieNotice.tsx is a notice rather than a consent gate —
 * see the comment there.
 *
 * Nothing renders until NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set, so local
 * development and preview deployments stay out of the production numbers
 * without any extra configuration.
 *
 * The nonce is required: proxy.ts serves a `strict-dynamic` CSP in production,
 * under which host allowlists are ignored and only nonce-carrying scripts run.
 */
export async function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  // Self-hosted Plausible/Umami instances serve the same script from their own
  // origin; point this at yours to avoid the hosted endpoint entirely.
  const src = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return <Script src={src} data-domain={domain} strategy="afterInteractive" nonce={nonce} />;
}
