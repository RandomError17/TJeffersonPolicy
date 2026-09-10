/**
 * openCaselist — deep links only, and the reason why.
 *
 * ## What was investigated (2026-09-07)
 *
 * openCaselist does run a real REST API. Its OpenAPI document is public at
 * https://api.opencaselist.com/v1/docs and describes 24 routes covering
 * caselists, schools, teams, rounds, cites, and open-evidence downloads.
 *
 * ## Why this application does not call it
 *
 * The spec declares exactly one security scheme:
 *
 *     securitySchemes: { cookie: { type: apiKey, in: cookie, name: caselist_token } }
 *
 * and `security: [{ cookie: [] }]` applies it to every route including /search
 * and /openev. That cookie is issued by POST /login, which authenticates
 * against Tabroom's own credential store. There is no service token, no client
 * credentials grant, and no anonymous read tier.
 *
 * Integrating server-side would therefore mean collecting and replaying our
 * members' Tabroom passwords. That is exactly the thing this project refuses to
 * do for Ion, and it is no more acceptable here. Storing a single shared
 * officer login instead would attribute every member's activity to one account
 * and put that officer's credentials in our database — also refused.
 *
 * ## What we do instead
 *
 * Deep links. Members reach openCaselist already signed in to their own
 * account, in their own browser, with their own permissions. The functions
 * below build correct URLs and nothing more; nothing here performs a request.
 *
 * If openCaselist ever issues application-level tokens, `OpenCaselistAdapter`
 * below is the seam to implement against — no call site would change.
 */

const BASE = "https://opencaselist.com";

/** Caselists are named <event><two-digit year>, e.g. "hspolicy26". */
export function currentCaselistSlug(seasonStartYear: number): string {
  return `hspolicy${String(seasonStartYear + 1).slice(2)}`;
}

export const openCaselist = {
  home: BASE,
  /** The high-school policy caselist for a given season. */
  caselist(seasonStartYear: number): string {
    return `${BASE}/${currentCaselistSlug(seasonStartYear)}`;
  },
  /** Open Evidence project archive — freely browsable. */
  openEvidence: `${BASE}/openev`,
  /** Site-wide search page. */
  search(query: string): string {
    return `${BASE}/search?q=${encodeURIComponent(query)}`;
  },
  /** A school's page within a caselist, when the exact name is known. */
  school(seasonStartYear: number, schoolName: string): string {
    return `${BASE}/${currentCaselistSlug(seasonStartYear)}/${encodeURIComponent(schoolName)}`;
  },
} as const;

/**
 * The seam a future authenticated integration would implement. Intentionally
 * unimplemented: there is no legitimate way to satisfy it today, and a stub
 * that returned fabricated results would be worse than none.
 */
export interface OpenCaselistAdapter {
  searchCites(query: string): Promise<{ title: string; url: string; team?: string }[]>;
}

export const openCaselistAdapter: OpenCaselistAdapter | null = null;
