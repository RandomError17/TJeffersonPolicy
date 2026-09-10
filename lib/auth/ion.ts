/**
 * TJ Intranet (Ion) OAuth 2.0 provider — the real integration.
 *
 * Ion runs django-oauth-toolkit and exposes a standard authorization-code
 * flow. Verified against the live service and the published documentation:
 *
 *   authorize : https://ion.tjhsst.edu/oauth/authorize/
 *   token     : https://ion.tjhsst.edu/oauth/token/
 *   profile   : https://ion.tjhsst.edu/api/profile   (Bearer, scope "read")
 *
 * Register the application at https://ion.tjhsst.edu/oauth/applications/ as a
 * *confidential* client using the *authorization-code* grant, with the redirect
 * URI set to  <APP_URL>/api/auth/callback .
 *
 * The user authenticates on ion.tjhsst.edu. This application never renders an
 * Ion-branded password field, never receives an Ion password, and does not
 * retain the issued access or refresh tokens: the token is used once to read
 * the profile and is then discarded.
 */
import { createHash, randomBytes } from "node:crypto";
import { env } from "../env";
import { AuthError, type AuthProvider, type AuthorizationRequest, type ExternalProfile } from "./provider";

/** Ion's /api/profile response, narrowed to the fields we actually consume. */
interface IonProfile {
  id?: number;
  ion_username?: string;
  display_name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  short_name?: string;
  user_type?: string;
  graduation_year?: number | null;
  tj_email?: string | null;
  grade?: { number?: number | null; name?: string | null } | null;
}

/** Ion user types we accept. Everything else (service accounts) is refused. */
const ACCEPTED_USER_TYPES = new Set(["student", "teacher", "counselor"]);

function base64url(input: Buffer): string {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export class IonAuthProvider implements AuthProvider {
  readonly id = "ion";
  readonly displayName = "TJ Ion";
  readonly isProductionSafe = true;

  private get clientId(): string {
    if (!env.ION_CLIENT_ID) throw new AuthError("ION_CLIENT_ID is not configured.", "disabled");
    return env.ION_CLIENT_ID;
  }

  private get clientSecret(): string {
    if (!env.ION_CLIENT_SECRET) throw new AuthError("ION_CLIENT_SECRET is not configured.", "disabled");
    return env.ION_CLIENT_SECRET;
  }

  private endpoint(path: string): string {
    return new URL(path, env.ION_BASE_URL).toString();
  }

  async createAuthorizationRequest(redirectUri: string): Promise<AuthorizationRequest> {
    const state = base64url(randomBytes(32));
    const nonce = base64url(randomBytes(16));
    const codeVerifier = base64url(randomBytes(48));

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "read",
      state,
    });

    if (env.ION_USE_PKCE) {
      params.set("code_challenge", base64url(createHash("sha256").update(codeVerifier).digest()));
      params.set("code_challenge_method", "S256");
    }

    return { url: `${this.endpoint("/oauth/authorize/")}?${params}`, state, codeVerifier, nonce };
  }

  async completeAuthorization({
    code,
    redirectUri,
    codeVerifier,
  }: {
    code: string;
    redirectUri: string;
    codeVerifier: string;
  }): Promise<ExternalProfile> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
    if (env.ION_USE_PKCE) body.set("code_verifier", codeVerifier);

    const tokenResponse = await fetch(this.endpoint("/oauth/token/"), {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!tokenResponse.ok) {
      // The response body can echo the client secret back in error cases, so it
      // is deliberately not logged or surfaced.
      throw new AuthError(`Ion rejected the authorization code (HTTP ${tokenResponse.status}).`, "exchange_failed");
    }

    const token = (await tokenResponse.json()) as { access_token?: string; token_type?: string };
    if (!token.access_token) throw new AuthError("Ion did not return an access token.", "exchange_failed");

    const profileResponse = await fetch(this.endpoint("/api/profile"), {
      headers: { authorization: `Bearer ${token.access_token}`, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!profileResponse.ok) {
      throw new AuthError(`Could not read your Ion profile (HTTP ${profileResponse.status}).`, "profile_failed");
    }

    return normaliseIonProfile((await profileResponse.json()) as IonProfile);
  }
}

/** Exported for unit tests: pure mapping from Ion's payload to our shape. */
export function normaliseIonProfile(profile: IonProfile): ExternalProfile {
  const username = profile.ion_username?.trim();
  if (!username) throw new AuthError("Ion profile did not include a username.", "profile_failed");

  const userType = (profile.user_type ?? "").toLowerCase();
  if (!ACCEPTED_USER_TYPES.has(userType)) {
    throw new AuthError(
      "This Ion account is not a student or staff account, so it cannot be used to sign in.",
      "not_a_student",
    );
  }

  const first = profile.first_name?.trim() ?? "";
  const last = profile.last_name?.trim() ?? "";
  const display = profile.display_name?.trim() || profile.full_name?.trim() || [first, last].filter(Boolean).join(" ");

  const gradeNumber = typeof profile.grade?.number === "number" ? profile.grade.number : undefined;

  return {
    providerId: username.toLowerCase(),
    numericId: typeof profile.id === "number" ? profile.id : undefined,
    firstName: first || display || username,
    lastName: last,
    displayName: display || username,
    email: profile.tj_email?.trim() || undefined,
    graduationYear: typeof profile.graduation_year === "number" ? profile.graduation_year : undefined,
    // Ion reports 13 for staff; only 9–12 is a real grade.
    gradeNumber: gradeNumber && gradeNumber >= 9 && gradeNumber <= 12 ? gradeNumber : undefined,
    isStudent: userType === "student",
    providerUserType: userType,
  };
}
