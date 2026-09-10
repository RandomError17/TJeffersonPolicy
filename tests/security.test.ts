import { describe, expect, it, beforeEach } from "vitest";
import { HttpError, assertCanActOnUser, isOfficer } from "@/lib/auth/guards";
import { isListedOfficer, parseOfficerList } from "@/lib/env";
import { RATE_LIMITS, consume, resetRateLimits } from "@/lib/http/rate-limit";
import { registrationsToCsv } from "@/lib/services/registrations";
import { externalUrlSchema, updateProfileSchema, tournamentSchema } from "@/lib/validation/schemas";

const member = { id: "u1", role: "MEMBER" } as never;
const otherMember = { id: "u2", role: "MEMBER" } as never;
const officer = { id: "u3", role: "OFFICER" } as never;

describe("authorization helpers", () => {
  it("recognises the officer role and nothing else", () => {
    expect(isOfficer({ role: "OFFICER" })).toBe(true);
    expect(isOfficer({ role: "MEMBER" })).toBe(false);
    // A forged value must not be treated as privileged.
    expect(isOfficer({ role: "officer" })).toBe(false);
    expect(isOfficer({ role: "ADMIN" })).toBe(false);
  });

  it("lets a member act only on themselves", () => {
    expect(() => assertCanActOnUser(member, "u1")).not.toThrow();
    expect(() => assertCanActOnUser(member, "u2")).toThrow(HttpError);
  });

  it("lets an officer act on anyone", () => {
    expect(() => assertCanActOnUser(officer, "u1")).not.toThrow();
    expect(() => assertCanActOnUser(officer, "u3")).not.toThrow();
  });

  it("reports 403, not 404, when a member reaches for someone else", () => {
    try {
      assertCanActOnUser(otherMember, "u1");
      throw new Error("should have thrown");
    } catch (error) {
      expect((error as HttpError).status).toBe(403);
    }
  });
});

describe("rate limiting", () => {
  beforeEach(() => resetRateLimits());

  it("allows requests up to the limit and rejects the next one", () => {
    const rule = { limit: 3, windowMs: 60_000 };
    for (let i = 0; i < 3; i += 1) expect(() => consume("k", rule)).not.toThrow();
    expect(() => consume("k", rule)).toThrow(HttpError);
  });

  it("counts each key separately", () => {
    const rule = { limit: 1, windowMs: 60_000 };
    expect(() => consume("a", rule)).not.toThrow();
    expect(() => consume("b", rule)).not.toThrow();
    expect(() => consume("a", rule)).toThrow();
  });

  it("returns 429 with a retry hint", () => {
    const rule = { limit: 1, windowMs: 60_000 };
    consume("z", rule);
    try {
      consume("z", rule);
      throw new Error("should have thrown");
    } catch (error) {
      expect((error as HttpError).status).toBe(429);
      expect((error as HttpError).message).toMatch(/Try again in \d+ seconds?/);
    }
  });

  it("applies a tighter budget to sign-in than to ordinary writes", () => {
    expect(RATE_LIMITS.auth.limit).toBeLessThan(RATE_LIMITS.write.limit);
  });
});

describe("URL validation", () => {
  it("accepts http, https, and mailto", () => {
    expect(externalUrlSchema.safeParse("https://tabroom.com").success).toBe(true);
    expect(externalUrlSchema.safeParse("http://example.com").success).toBe(true);
    expect(externalUrlSchema.safeParse("mailto:a@b.com").success).toBe(true);
  });

  it("rejects script-bearing and file schemes", () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,<script>", "file:///etc/passwd", "vbscript:x", "not a url"]) {
      expect(externalUrlSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe("profile input", () => {
  it("only accepts known event codes", () => {
    expect(updateProfileSchema.safeParse({ events: ["POLICY_VARSITY"] }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ events: ["ADMIN"] }).success).toBe(false);
  });

  it("has no field that could change a role or a dues status", () => {
    const parsed = updateProfileSchema.parse({
      events: [],
      // Extra keys are stripped by the schema rather than passed through.
      role: "OFFICER",
      status: "PAID",
    } as never);
    expect(parsed).not.toHaveProperty("role");
    expect(parsed).not.toHaveProperty("status");
  });
});

describe("tournament input", () => {
  const base = {
    name: "Test Invitational",
    startDate: "2026-10-01T12:00:00.000Z",
    location: "Alexandria, VA",
    divisions: [{ name: "Policy — Varsity" }],
  };

  it("accepts a well-formed tournament", () => {
    expect(tournamentSchema.safeParse(base).success).toBe(true);
  });

  it("requires at least one division", () => {
    const result = tournamentSchema.safeParse({ ...base, divisions: [] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toMatch(/at least one/i);
  });

  it("rejects an unknown status or circuit", () => {
    expect(tournamentSchema.safeParse({ ...base, status: "SECRET" }).success).toBe(false);
    expect(tournamentSchema.safeParse({ ...base, circuit: "GALACTIC" }).success).toBe(false);
  });
});

describe("CSV export", () => {
  const row = {
    user: { displayName: "Ana Duarte", ionUsername: "2026ad", gradeNumber: 12 },
    tournament: { name: 'Fall "Classic", 2026', startDate: new Date("2026-10-03T00:00:00Z") },
    division: { name: "Policy — Varsity", feeCents: 4000 },
    status: "REGISTERED",
    partnerName: "Sample Partner",
    partnerSchoolEmail: null,
    schoolEmail: null,
    tabroomEmail: null,
    phoneNumber: null,
    grade: 12,
    memberNote: null,
    feePaid: false,
    createdAt: new Date("2026-09-01T00:00:00Z"),
  };

  it("quotes fields and doubles embedded quotes", () => {
    const csv = registrationsToCsv([row]);
    expect(csv).toContain('"Fall ""Classic"", 2026"');
  });

  it("neutralises spreadsheet formula injection", () => {
    const csv = registrationsToCsv([{ ...row, user: { ...row.user, displayName: "=cmd|'/c calc'!A1" } }]);
    // The leading = is prefixed so a spreadsheet treats it as text.
    expect(csv).toContain("\"'=cmd");
    expect(csv).not.toMatch(/,"=cmd/);
  });

  it("emits a header row", () => {
    expect(registrationsToCsv([]).split("\r\n")[0]).toContain('"Name"');
  });
});

describe("officer username list", () => {
  // vitest.config.mts sets no OFFICER_USERNAMES, so the list is empty here and
  // these assertions pin the normalisation and the promote-only contract
  // rather than any particular roster.
  it("treats an unset list as nobody", () => {
    expect(isListedOfficer("2028rreddy")).toBe(false);
  });

  it("compares case-insensitively and ignores surrounding whitespace", () => {
    // parseOfficerList is the pure half of the check; the live Set is built
    // from it at module load.
    expect(parseOfficerList("2028RReddy, 2028achapuri ,,")).toEqual(["2028rreddy", "2028achapuri"]);
  });

  it("accepts a single username with no commas", () => {
    expect(parseOfficerList("2028rreddy")).toEqual(["2028rreddy"]);
  });

  it("returns nothing for an empty or whitespace-only setting", () => {
    expect(parseOfficerList("")).toEqual([]);
    expect(parseOfficerList("   ")).toEqual([]);
    expect(parseOfficerList(",,,")).toEqual([]);
  });
});
