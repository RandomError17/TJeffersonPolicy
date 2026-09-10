import { describe, expect, it } from "vitest";
import { normaliseIonProfile } from "@/lib/auth/ion";
import { AuthError } from "@/lib/auth/provider";

/**
 * Shapes here mirror the real /api/profile payload documented at
 * https://ion.readthedocs.io and the serializer in tjcsl/ion.
 */
const student = {
  id: 4821,
  ion_username: "2028Rreddy",
  display_name: "Ritham Reddy",
  first_name: "Ritham",
  last_name: "Reddy",
  user_type: "student",
  graduation_year: 2028,
  tj_email: "2028rreddy@tjhsst.edu",
  grade: { number: 10, name: "sophomore" },
};

describe("normaliseIonProfile", () => {
  it("maps a student profile onto our shape", () => {
    const profile = normaliseIonProfile(student);
    expect(profile).toMatchObject({
      providerId: "2028rreddy",
      numericId: 4821,
      firstName: "Ritham",
      lastName: "Reddy",
      displayName: "Ritham Reddy",
      email: "2028rreddy@tjhsst.edu",
      graduationYear: 2028,
      gradeNumber: 10,
      isStudent: true,
    });
  });

  it("lower-cases the username so the account key is stable across sign-ins", () => {
    expect(normaliseIonProfile({ ...student, ion_username: "2028RREDDY" }).providerId).toBe("2028rreddy");
  });

  it("accepts staff accounts but does not mark them students", () => {
    const teacher = normaliseIonProfile({
      ...student,
      user_type: "teacher",
      grade: { number: 13, name: "staff" },
      graduation_year: null,
    });
    expect(teacher.isStudent).toBe(false);
    // Ion reports 13 for staff; that is not a real grade.
    expect(teacher.gradeNumber).toBeUndefined();
  });

  it("refuses service accounts and unknown user types", () => {
    expect(() => normaliseIonProfile({ ...student, user_type: "service" })).toThrow(AuthError);
    expect(() => normaliseIonProfile({ ...student, user_type: "" })).toThrow(AuthError);
  });

  it("refuses a payload with no username", () => {
    expect(() => normaliseIonProfile({ ...student, ion_username: undefined })).toThrow(AuthError);
  });

  it("falls back to full_name, then the username, when display_name is missing", () => {
    expect(normaliseIonProfile({ ...student, display_name: undefined, full_name: "R Reddy" }).displayName).toBe("R Reddy");
    expect(
      normaliseIonProfile({
        ion_username: "2028x",
        user_type: "student",
        display_name: undefined,
        full_name: undefined,
        first_name: undefined,
        last_name: undefined,
      }).displayName,
    ).toBe("2028x");
  });

  it("tolerates a missing grade and a null tj_email", () => {
    const profile = normaliseIonProfile({ ...student, grade: null, tj_email: null });
    expect(profile.gradeNumber).toBeUndefined();
    expect(profile.email).toBeUndefined();
  });
});
