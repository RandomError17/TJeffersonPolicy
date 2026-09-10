/**
 * Tabroom — read-only tournament metadata import.
 *
 * ## What Tabroom actually offers (verified 2026-09-07)
 *
 * Tabroom has no documented public API and no OAuth. It does expose one
 * unauthenticated JSON endpoint that serves the public backup of a tournament:
 *
 *     GET https://www.tabroom.com/api/download_data.mhtml?tourn_id=<id>
 *
 * It returns the tournament's name, web name, start/end datetimes, registration
 * window, city/state/country, timezone, and a `categories[].events[]` tree with
 * event names, abbreviations, types, and fees. It also returns entry lists,
 * judges, schools, and results.
 *
 * ## What this adapter does with that
 *
 * Import is officer-initiated, one tournament at a time, rate limited, and
 * **metadata only**. `extractTournamentMetadata` reads the scheduling fields and
 * the event list and drops everything else on the floor — this application has
 * no reason to hold the names of minors from other schools, so it does not
 * store them even transiently beyond the parse.
 *
 * ## What this adapter deliberately does not do
 *
 * No automated entry, no credentialed access, no HTML scraping, and no
 * background polling. Tabroom entry stays a manual officer task, and the
 * tournament record keeps `tabroomUrl` so officers reach it in one click. If
 * Tabroom later ships a real API, `fetchTournament` is the only function that
 * needs to change.
 */
import { env } from "../env";
import { HttpError } from "../auth/guards";

export interface TabroomEvent {
  externalId?: string;
  name: string;
  abbreviation?: string;
  type?: string;
  feeCents?: number;
}

export interface TabroomTournamentMetadata {
  tabroomId: number;
  name: string;
  webname?: string;
  url: string;
  startDate?: Date;
  endDate?: Date;
  registrationOpensAt?: Date;
  registrationDeadline?: Date;
  location?: string;
  timezone?: string;
  events: TabroomEvent[];
}

/** True when the officer-facing import button should be offered at all. */
export const tabroomImportEnabled = env.TABROOM_IMPORT_ENABLED;

/**
 * Accepts a numeric id, or any tabroom.com URL carrying `tourn_id`.
 * Subdomain-style links (https://<webname>.tabroom.com) do not contain the id,
 * so those are rejected with an explanation rather than guessed at.
 */
export function parseTabroomReference(reference: string): number {
  const trimmed = reference.trim();

  if (/^\d+$/.test(trimmed)) {
    const id = Number.parseInt(trimmed, 10);
    if (id > 0 && id < 10_000_000) return id;
    throw new HttpError(422, "That does not look like a Tabroom tournament id.", "invalid_reference");
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new HttpError(422, "Paste a tabroom.com link or the numeric tournament id.", "invalid_reference");
  }

  if (!url.hostname.endsWith("tabroom.com")) {
    throw new HttpError(422, "That link is not on tabroom.com.", "invalid_reference");
  }

  const raw = url.searchParams.get("tourn_id");
  const id = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(id) || id <= 0) {
    throw new HttpError(
      422,
      "That Tabroom link has no tourn_id. Open the tournament's main page on tabroom.com — its address ends in ?tourn_id=NNNNN — and paste that, or enter the id on its own.",
      "invalid_reference",
    );
  }
  return id;
}

/** Tabroom serves naive local datetimes; the payload's timezone gives context. */
function parseTabroomDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const normalised = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalised);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/**
 * Pure transform from Tabroom's payload to our shape. Exported so it can be
 * unit tested against a captured fixture without touching the network.
 */
export function extractTournamentMetadata(payload: unknown, tabroomId: number): TabroomTournamentMetadata {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(502, "Tabroom returned an unexpected response.", "tabroom_unavailable");
  }

  const data = payload as Record<string, unknown>;
  const name = asString(data.name);
  if (!name) {
    throw new HttpError(404, `Tabroom has no public data for tournament ${tabroomId}.`, "not_found");
  }

  const events: TabroomEvent[] = [];
  const categories = Array.isArray(data.categories) ? data.categories : [];
  for (const category of categories) {
    if (!category || typeof category !== "object") continue;
    const list = (category as Record<string, unknown>).events;
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      if (!raw || typeof raw !== "object") continue;
      const event = raw as Record<string, unknown>;
      const eventName = asString(event.name);
      if (!eventName) continue;
      const fee = Number.parseFloat(String(event.fee ?? ""));
      events.push({
        externalId: asString(event.id) ?? (typeof event.id === "number" ? String(event.id) : undefined),
        name: eventName,
        abbreviation: asString(event.abbr),
        type: asString(event.type),
        feeCents: Number.isFinite(fee) && fee > 0 ? Math.round(fee * 100) : undefined,
      });
    }
  }

  const location = [asString(data.city), asString(data.state)].filter(Boolean).join(", ") || undefined;

  return {
    tabroomId,
    name,
    webname: asString(data.webname),
    url: `https://www.tabroom.com/index/tourn/index.mhtml?tourn_id=${tabroomId}`,
    startDate: parseTabroomDate(data.start),
    endDate: parseTabroomDate(data.end),
    registrationOpensAt: parseTabroomDate(data.reg_start),
    registrationDeadline: parseTabroomDate(data.reg_end),
    location,
    timezone: asString(data.timezone),
    events,
  };
}

/**
 * Fetch and normalise one tournament. Network failures are translated into
 * HttpErrors so the officer sees an explanation and the manual path stays
 * available — the UI never depends on this succeeding.
 */
export async function fetchTournament(tabroomId: number): Promise<TabroomTournamentMetadata> {
  if (!tabroomImportEnabled) {
    throw new HttpError(503, "Tabroom import is disabled in this deployment.", "disabled");
  }

  let response: Response;
  try {
    response = await fetch(`https://www.tabroom.com/api/download_data.mhtml?tourn_id=${tabroomId}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new HttpError(504, "Could not reach Tabroom. Enter the tournament details manually.", "tabroom_unavailable");
  }

  if (!response.ok) {
    throw new HttpError(502, `Tabroom responded with HTTP ${response.status}.`, "tabroom_unavailable");
  }

  const text = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new HttpError(502, "Tabroom did not return JSON for that tournament.", "tabroom_unavailable");
  }

  return extractTournamentMetadata(payload, tabroomId);
}
