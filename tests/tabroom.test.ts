import { describe, expect, it } from "vitest";
import { extractTournamentMetadata, parseTabroomReference } from "@/lib/integrations/tabroom";
import { HttpError } from "@/lib/auth/guards";

/**
 * Fixture trimmed from a real response of
 * https://www.tabroom.com/api/download_data.mhtml?tourn_id=34000 — the same
 * field names the live endpoint returns, including the entry data this
 * adapter deliberately discards.
 */
const payload = {
  id: 34000,
  name: "The Patriot Games PF Online 2025",
  webname: "thepatriotgamespf",
  start: "2025-01-17 14:00:00",
  end: "2025-01-19 06:55:00",
  reg_start: "2024-11-22 14:00:00",
  reg_end: "2025-01-15 00:00:00",
  city: "NSDA Campus",
  state: "CO",
  country: "US",
  timezone: "America/Denver",
  categories: [
    {
      abbr: "PF",
      name: "PF Judges",
      events: [{ id: "319283", name: "Public Forum (TOC)", abbr: "PF", type: "debate", fee: "50.00" }],
    },
  ],
  // Present in the real payload; must not survive extraction.
  schools: [{ code: "1", students: [{ first: "Someone", last: "Else", id: "1216747" }] }],
};

describe("parseTabroomReference", () => {
  it("accepts a bare numeric id", () => {
    expect(parseTabroomReference("34000")).toBe(34000);
    expect(parseTabroomReference("  34000  ")).toBe(34000);
  });

  it("accepts any tabroom.com URL carrying tourn_id", () => {
    expect(parseTabroomReference("https://www.tabroom.com/index/tourn/index.mhtml?tourn_id=34000")).toBe(34000);
    expect(parseTabroomReference("https://www.tabroom.com/index/tourn/postings/index.mhtml?tourn_id=1234&x=1")).toBe(1234);
  });

  it("rejects a non-tabroom host", () => {
    expect(() => parseTabroomReference("https://example.com/?tourn_id=1")).toThrow(HttpError);
  });

  it("explains what to do for subdomain links, which carry no id", () => {
    expect(() => parseTabroomReference("https://thepatriotgamespf.tabroom.com")).toThrow(/tourn_id/);
  });

  it("rejects text that is neither a URL nor a number", () => {
    expect(() => parseTabroomReference("the patriot games")).toThrow(HttpError);
    expect(() => parseTabroomReference("0")).toThrow(HttpError);
  });
});

describe("extractTournamentMetadata", () => {
  it("pulls scheduling fields and the event list", () => {
    const metadata = extractTournamentMetadata(payload, 34000);

    expect(metadata.name).toBe("The Patriot Games PF Online 2025");
    expect(metadata.location).toBe("NSDA Campus, CO");
    expect(metadata.url).toContain("tourn_id=34000");
    expect(metadata.startDate?.getFullYear()).toBe(2025);
    expect(metadata.registrationDeadline).toBeInstanceOf(Date);
    expect(metadata.events).toEqual([
      { externalId: "319283", name: "Public Forum (TOC)", abbreviation: "PF", type: "debate", feeCents: 5000 },
    ]);
  });

  it("keeps no personal data from the payload", () => {
    // The important property of this adapter: entry lists, judges, and results
    // are dropped rather than stored.
    const serialised = JSON.stringify(extractTournamentMetadata(payload, 34000));
    expect(serialised).not.toContain("schools");
    expect(serialised).not.toContain("Someone");
    expect(serialised).not.toContain("1216747");
  });

  it("throws a 404 when Tabroom has no public data for the id", () => {
    expect(() => extractTournamentMetadata({}, 99)).toThrow(HttpError);
    expect(() => extractTournamentMetadata({ categories: [] }, 99)).toThrow(/no public data/);
  });

  it("throws rather than guessing when the response is not an object", () => {
    expect(() => extractTournamentMetadata("not json", 1)).toThrow(HttpError);
    expect(() => extractTournamentMetadata(null, 1)).toThrow(HttpError);
  });

  it("survives missing optional fields", () => {
    const metadata = extractTournamentMetadata({ name: "Minimal Tournament" }, 7);
    expect(metadata.name).toBe("Minimal Tournament");
    expect(metadata.events).toEqual([]);
    expect(metadata.startDate).toBeUndefined();
    expect(metadata.location).toBeUndefined();
  });

  it("ignores a zero or unparseable fee rather than storing $0", () => {
    const metadata = extractTournamentMetadata(
      { name: "T", categories: [{ events: [{ name: "CX", fee: "0.00" }, { name: "LD", fee: "free" }] }] },
      1,
    );
    expect(metadata.events[0].feeCents).toBeUndefined();
    expect(metadata.events[1].feeCents).toBeUndefined();
  });
});
