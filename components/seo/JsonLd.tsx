import { headers } from "next/headers";

/**
 * Structured data (schema.org) emitted as a JSON-LD block.
 *
 * Two details worth knowing:
 *
 *  1. The nonce. `application/ld+json` is a data block rather than executable
 *     script, so browsers do not run it and the CSP in proxy.ts is not
 *     strictly required to allow it. Stamping the nonce anyway costs nothing
 *     and keeps us correct against stricter interpretations.
 *
 *  2. The escaping. `<` inside a JSON string is rewritten to its unicode
 *     escape so a value containing "</script>" — a news headline, say — cannot
 *     close the block early and inject markup. JSON.stringify alone does not
 *     do this.
 */
export async function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // The payload is built from our own data and escaped above.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
