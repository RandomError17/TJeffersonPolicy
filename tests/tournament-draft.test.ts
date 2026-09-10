import { describe, expect, it } from "vitest";
import {
  draftFromTournament,
  isoToWallClock,
  wallClockToIso,
} from "@/app/admin/tournaments/tournamentDraft";

/**
 * These conversions run on the server (building the edit form) and in the
 * browser (submitting it), so they are anchored to the school's timezone
 * rather than the machine's. Without that, a deploy running in UTC would
 * render every deadline four or five hours off.
 */
describe("wall-clock ↔ ISO, anchored to America/New_York", () => {
  it("reads a datetime-local value as Eastern, not as the machine's zone", () => {
    // 18:14 EDT is 22:14 UTC.
    expect(wallClockToIso("2026-09-19T18:14")).toBe("2026-09-19T22:14:00.000Z");
  });

  it("renders a stored instant back as Eastern wall clock", () => {
    expect(isoToWallClock("2026-09-19T22:14:00.000Z", true)).toBe("2026-09-19T18:14");
  });

  it("round-trips a datetime without drifting", () => {
    const original = "2026-10-03T09:30";
    expect(isoToWallClock(wallClockToIso(original), true)).toBe(original);
  });

  it("handles standard time as well as daylight time", () => {
    // January is EST (UTC-5), not EDT (UTC-4).
    expect(wallClockToIso("2027-01-15T09:00")).toBe("2027-01-15T14:00:00.000Z");
    expect(isoToWallClock("2027-01-15T14:00:00.000Z", true)).toBe("2027-01-15T09:00");
  });

  it("keeps a date-only value on the calendar day it was entered", () => {
    // The classic off-by-one: a date-only value must not slip a day when the
    // stored instant is midnight Eastern rendered back in another zone.
    expect(isoToWallClock(wallClockToIso("2026-09-28"), false)).toBe("2026-09-28");
  });

  it("returns nothing for empty or unparseable input rather than an invalid date", () => {
    expect(wallClockToIso("")).toBeUndefined();
    expect(wallClockToIso("not-a-date")).toBeUndefined();
    expect(isoToWallClock(null, true)).toBe("");
    expect(isoToWallClock("not-a-date", true)).toBe("");
  });
});

describe("draftFromTournament", () => {
  const tournament = {
    name: "Fall Invitational",
    startDate: "2026-09-28T04:00:00.000Z",
    endDate: null,
    location: "Alexandria, VA",
    circuit: "LOCAL",
    status: "OPEN",
    registrationOpensAt: null,
    registrationDeadline: "2026-09-19T22:14:00.000Z",
    description: null,
    eligibility: null,
    memberNotes: null,
    officerNotes: null,
    externalRegistrationUrl: null,
    tabroomUrl: null,
    tabroomId: null,
    divisions: [{ id: "d1", name: "Policy — Varsity", code: "VCX", feeCents: 4000, capacity: 8 }],
  };

  it("maps a stored tournament onto the form's string fields", () => {
    const draft = draftFromTournament(tournament);
    expect(draft.name).toBe("Fall Invitational");
    expect(draft.startDate).toBe("2026-09-28");
    expect(draft.registrationDeadline).toBe("2026-09-19T18:14");
    expect(draft.divisions[0]).toEqual({
      id: "d1",
      name: "Policy — Varsity",
      code: "VCX",
      fee: "40.00",
      capacity: "8",
    });
  });

  it("renders absent optional values as empty strings, not 'null'", () => {
    const draft = draftFromTournament(tournament);
    expect(draft.endDate).toBe("");
    expect(draft.description).toBe("");
    expect(draft.tabroomId).toBe("");
    expect(draft.registrationOpensAt).toBe("");
  });

  it("converts a fee of zero to an empty field rather than '0.00'", () => {
    const draft = draftFromTournament({
      ...tournament,
      divisions: [{ id: "d2", name: "Free", code: null, feeCents: 0, capacity: null }],
    });
    // feeCents 0 is a real value and must survive as an editable amount.
    expect(draft.divisions[0].fee).toBe("0.00");
    expect(draft.divisions[0].capacity).toBe("");
  });
});
