import { describe, expect, it } from "vitest";
import { asKey, currentSeasonYear, labelFor, seasonLabel, DUES_STATUSES } from "@/lib/constants";
import { parseStringList, parseRecord, serializeStringList } from "@/lib/json";
import { slugify, uniqueSlug } from "@/lib/utils/slug";
import { formatDateRange, formatMoney, initials, pluralize } from "@/lib/utils/format";
import { isRegistrationOpen } from "@/lib/services/tournaments";
import { currentCaselistSlug, openCaselist } from "@/lib/integrations/opencaselist";
import { paymentUrl } from "@/lib/integrations/myschoolbucks";

describe("seasons", () => {
  it("treats August as the start of the next season", () => {
    expect(currentSeasonYear(new Date("2026-08-01T12:00:00"))).toBe(2026);
    expect(currentSeasonYear(new Date("2026-12-31T12:00:00"))).toBe(2026);
  });

  it("treats January–July as belonging to the season that started last year", () => {
    expect(currentSeasonYear(new Date("2026-01-15T12:00:00"))).toBe(2025);
    expect(currentSeasonYear(new Date("2026-07-31T12:00:00"))).toBe(2025);
  });

  it("labels a season by both years", () => {
    expect(seasonLabel(2026)).toBe("2026–27");
    expect(seasonLabel(1999)).toBe("1999–00");
  });
});

describe("label lookup", () => {
  it("never renders a raw database value", () => {
    expect(labelFor(DUES_STATUSES, "PAID")).toBe("Paid");
    expect(labelFor(DUES_STATUSES, "SOMETHING_ELSE")).toBe("Unknown");
    expect(labelFor(DUES_STATUSES, "SOMETHING_ELSE", "Unpaid")).toBe("Unpaid");
  });

  it("does not treat inherited object properties as valid keys", () => {
    expect(labelFor(DUES_STATUSES, "toString")).toBe("Unknown");
    expect(asKey(DUES_STATUSES, "constructor", "UNPAID")).toBe("UNPAID");
  });
});

describe("JSON columns", () => {
  it("round-trips a list", () => {
    expect(parseStringList(serializeStringList(["a", "b"]))).toEqual(["a", "b"]);
  });

  it("degrades to an empty list rather than throwing on bad data", () => {
    expect(parseStringList("not json")).toEqual([]);
    expect(parseStringList(null)).toEqual([]);
    expect(parseStringList('{"a":1}')).toEqual([]);
  });

  it("drops non-string members", () => {
    expect(parseStringList('["a",1,null,"b"]')).toEqual(["a", "b"]);
  });

  it("parses objects defensively", () => {
    expect(parseRecord('{"a":1}')).toEqual({ a: 1 });
    expect(parseRecord("[1,2]")).toEqual({});
    expect(parseRecord("broken")).toEqual({});
  });
});

describe("slugs", () => {
  it("makes a URL-safe slug", () => {
    expect(slugify("Fall Classic 2026!")).toBe("fall-classic-2026");
    expect(slugify("  Spaces   everywhere  ")).toBe("spaces-everywhere");
    expect(slugify("Policy — Varsity")).toBe("policy-varsity");
  });

  it("strips diacritics rather than dropping the letters", () => {
    expect(slugify("Café Crème")).toBe("cafe-creme");
  });

  it("falls back when there is nothing usable", () => {
    expect(slugify("!!!")).toMatch(/^item-/);
  });

  it("appends a suffix until the slug is free", async () => {
    const taken = new Set(["fall-classic", "fall-classic-2"]);
    expect(await uniqueSlug("Fall Classic", async (s) => taken.has(s))).toBe("fall-classic-3");
  });
});

describe("formatting", () => {
  it("formats money from cents", () => {
    expect(formatMoney(2500)).toBe("$25.00");
    expect(formatMoney(0)).toBe("$0.00");
    expect(formatMoney(null)).toBe("—");
  });

  it("collapses a single-day range", () => {
    const day = new Date("2026-10-03T15:00:00Z");
    expect(formatDateRange(day, day)).toBe(formatDateRange(day));
    expect(formatDateRange(day, new Date("2026-10-04T15:00:00Z"))).toContain("–");
  });

  it("builds initials from a name", () => {
    expect(initials("Ritham Reddy")).toBe("RR");
    expect(initials("Cher")).toBe("CH");
    expect(initials("Ana Maria Duarte")).toBe("AD");
    expect(initials("   ")).toBe("?");
  });

  it("pluralises", () => {
    expect(pluralize(1, "entry", "entries")).toBe("1 entry");
    expect(pluralize(2, "entry", "entries")).toBe("2 entries");
  });
});

describe("registration window", () => {
  const now = new Date("2026-09-10T12:00:00Z");

  it("is open only when the status says so", () => {
    expect(isRegistrationOpen({ status: "OPEN", registrationDeadline: null }, now)).toBe(true);
    expect(isRegistrationOpen({ status: "CLOSED", registrationDeadline: null }, now)).toBe(false);
    expect(isRegistrationOpen({ status: "DRAFT", registrationDeadline: null }, now)).toBe(false);
    expect(isRegistrationOpen({ status: "ARCHIVED", registrationDeadline: null }, now)).toBe(false);
  });

  it("closes once the deadline has passed, even while the status says open", () => {
    expect(isRegistrationOpen({ status: "OPEN", registrationDeadline: new Date("2026-09-09T12:00:00Z") }, now)).toBe(false);
    expect(isRegistrationOpen({ status: "OPEN", registrationDeadline: new Date("2026-09-11T12:00:00Z") }, now)).toBe(true);
  });
});

describe("external links", () => {
  it("names the caselist by the season's end year", () => {
    expect(currentCaselistSlug(2026)).toBe("hspolicy27");
    expect(openCaselist.caselist(2026)).toBe("https://opencaselist.com/hspolicy27");
  });

  it("encodes search queries", () => {
    expect(openCaselist.search("a b&c")).toBe("https://opencaselist.com/search?q=a%20b%26c");
  });

  it("prefers an item's own payment link, then the club default", () => {
    expect(paymentUrl("https://item.example", "https://club.example")).toBe("https://item.example");
    expect(paymentUrl(null, "https://club.example")).toBe("https://club.example");
    expect(paymentUrl(null, null)).toBe("https://www.myschoolbucks.com/");
  });
});
