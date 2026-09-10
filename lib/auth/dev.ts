/**
 * Local development sign-in.
 *
 * This is NOT a simulated Ion login. It never renders an Ion-branded screen,
 * never asks for an Ion password, and refuses to load when NODE_ENV is
 * production (enforced twice: here and in lib/env.ts). It exists so the portal
 * and officer dashboard can be built and tested before Ion OAuth credentials
 * are issued.
 *
 * It presents a plain list of seeded local accounts at /auth/dev and signs in
 * as whichever one is chosen.
 */
import { randomBytes } from "node:crypto";
import { prisma } from "../db";
import { env } from "../env";
import { AuthError, type AuthProvider, type AuthorizationRequest, type ExternalProfile } from "./provider";

export class DevAuthProvider implements AuthProvider {
  readonly id = "dev";
  readonly displayName = "Development accounts";
  readonly isProductionSafe = false;

  constructor() {
    if (env.NODE_ENV === "production") {
      throw new AuthError("The development auth provider cannot run in production.", "disabled");
    }
  }

  async createAuthorizationRequest(): Promise<AuthorizationRequest> {
    const state = randomBytes(24).toString("hex");
    return {
      // The "authorization server" is a local page listing seeded accounts.
      url: `/auth/dev?state=${encodeURIComponent(state)}`,
      state,
      codeVerifier: randomBytes(24).toString("hex"),
      nonce: randomBytes(8).toString("hex"),
    };
  }

  /**
   * `code` is the chosen account's Ion-style username. It is only trusted
   * because the whole provider is unreachable outside development.
   */
  async completeAuthorization({ code }: { code: string }): Promise<ExternalProfile> {
    const username = code.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { ionUsername: username } });

    if (!existing) {
      throw new AuthError(
        `No seeded development account named "${username}". Run \`npm run db:seed\` first.`,
        "profile_failed",
      );
    }

    return {
      providerId: existing.ionUsername,
      numericId: existing.ionUserId ?? undefined,
      firstName: existing.firstName,
      lastName: existing.lastName,
      displayName: existing.displayName,
      email: existing.tjEmail ?? undefined,
      graduationYear: existing.graduationYear ?? undefined,
      gradeNumber: existing.gradeNumber ?? undefined,
      isStudent: true,
      providerUserType: "student",
    };
  }
}
