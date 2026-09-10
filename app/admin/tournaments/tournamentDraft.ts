/**
 * The shape the tournament form edits, and the conversions between it and what
 * the database stores.
 *
 * This module deliberately carries no "use client" directive: the edit page is
 * a server component and builds the initial draft during render, while the
 * form itself is a client component that reads it back. A function exported
 * from a client module cannot be called from the server at all, so this has to
 * live outside TournamentForm.tsx.
 *
 * Times are anchored to the school's timezone rather than the machine's. A
 * `datetime-local` input has no timezone of its own, so without this an
 * officer editing from a different timezone — or a server running in UTC,
 * which is the normal case once deployed — would see and save times shifted by
 * several hours.
 */

const TIME_ZONE = "America/New_York";

export interface DivisionDraft {
  id?: string;
  name: string;
  code: string;
  fee: string;
  capacity: string;
}

export interface TournamentDraft {
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  circuit: string;
  status: string;
  registrationOpensAt: string;
  registrationDeadline: string;
  description: string;
  eligibility: string;
  memberNotes: string;
  officerNotes: string;
  externalRegistrationUrl: string;
  tabroomUrl: string;
  tabroomId: string;
  divisions: DivisionDraft[];
}

export const emptyDraft: TournamentDraft = {
  name: "",
  startDate: "",
  endDate: "",
  location: "",
  circuit: "LOCAL",
  status: "DRAFT",
  registrationOpensAt: "",
  registrationDeadline: "",
  description: "",
  eligibility: "",
  memberNotes: "",
  officerNotes: "",
  externalRegistrationUrl: "",
  tabroomUrl: "",
  tabroomId: "",
  divisions: [{ name: "Policy — Varsity", code: "VCX", fee: "", capacity: "" }],
};

/** How far `timeZone` sits from UTC at a given instant, in milliseconds. */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(instant);

  const at = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  // hour comes back as 24 at midnight under hour12:false in some engines.
  const asUtc = Date.UTC(at("year"), at("month") - 1, at("day"), at("hour") % 24, at("minute"), at("second"));

  return asUtc - instant.getTime();
}

/**
 * Read a `date` or `datetime-local` value as school-timezone wall clock and
 * return the corresponding UTC instant.
 */
export function wallClockToIso(value: string): string | undefined {
  if (!value) return undefined;

  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  if ([year, month, day, hour, minute].some((part) => !Number.isFinite(part))) return undefined;

  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute);
  // Two passes so an instant sitting near a DST transition resolves against
  // the offset actually in force on the far side of it.
  const firstPass = new Date(naiveUtc - zoneOffsetMs(new Date(naiveUtc), TIME_ZONE));
  return new Date(naiveUtc - zoneOffsetMs(firstPass, TIME_ZONE)).toISOString();
}

/** Render a stored instant as the school-timezone wall clock the inputs expect. */
export function isoToWallClock(iso: string | null | undefined, withTime: boolean): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const at = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  const base = `${at("year")}-${at("month")}-${at("day")}`;
  return withTime ? `${base}T${String(Number(at("hour")) % 24).padStart(2, "0")}:${at("minute")}` : base;
}

export function draftFromTournament(tournament: {
  name: string;
  startDate: string;
  endDate: string | null;
  location: string;
  circuit: string;
  status: string;
  registrationOpensAt: string | null;
  registrationDeadline: string | null;
  description: string | null;
  eligibility: string | null;
  memberNotes: string | null;
  officerNotes: string | null;
  externalRegistrationUrl: string | null;
  tabroomUrl: string | null;
  tabroomId: number | null;
  divisions: { id: string; name: string; code: string | null; feeCents: number | null; capacity: number | null }[];
}): TournamentDraft {
  return {
    name: tournament.name,
    startDate: isoToWallClock(tournament.startDate, false),
    endDate: isoToWallClock(tournament.endDate, false),
    location: tournament.location,
    circuit: tournament.circuit,
    status: tournament.status,
    registrationOpensAt: isoToWallClock(tournament.registrationOpensAt, true),
    registrationDeadline: isoToWallClock(tournament.registrationDeadline, true),
    description: tournament.description ?? "",
    eligibility: tournament.eligibility ?? "",
    memberNotes: tournament.memberNotes ?? "",
    officerNotes: tournament.officerNotes ?? "",
    externalRegistrationUrl: tournament.externalRegistrationUrl ?? "",
    tabroomUrl: tournament.tabroomUrl ?? "",
    tabroomId: tournament.tabroomId ? String(tournament.tabroomId) : "",
    divisions: tournament.divisions.map((division) => ({
      id: division.id,
      name: division.name,
      code: division.code ?? "",
      fee: division.feeCents != null ? (division.feeCents / 100).toFixed(2) : "",
      capacity: division.capacity != null ? String(division.capacity) : "",
    })),
  };
}
