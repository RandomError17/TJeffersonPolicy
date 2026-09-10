/**
 * Identity provider abstraction.
 *
 * The application never sees a password. A provider's only job is to run an
 * external sign-in and hand back a normalised profile; everything downstream
 * (account creation, roles, sessions) is ours.
 *
 * Swapping providers is a configuration change (AUTH_PROVIDER), not a code
 * change — see lib/auth/index.ts.
 */

/** Profile shape every provider must produce, whatever its native format. */
export interface ExternalProfile {
  /** Stable identifier from the provider. For Ion this is the Ion username. */
  providerId: string;
  /** Provider's numeric id, when it has one. */
  numericId?: number;
  firstName: string;
  lastName: string;
  displayName: string;
  /** School-issued address. Treated as private data everywhere in the app. */
  email?: string;
  graduationYear?: number;
  /** 9–12 for students; absent for staff. */
  gradeNumber?: number;
  /** True only when the provider positively identifies the user as a student. */
  isStudent: boolean;
  /** Raw user type string from the provider, kept for audit context. */
  providerUserType?: string;
}

export interface AuthorizationRequest {
  /** Where to send the browser to begin sign-in. */
  url: string;
  /** Opaque CSRF value; persisted server-side and re-checked on callback. */
  state: string;
  /** PKCE verifier. Never leaves the server. */
  codeVerifier: string;
  nonce: string;
}

export interface AuthProvider {
  /** Machine name, e.g. "ion". */
  readonly id: string;
  /** Shown on the sign-in screen. */
  readonly displayName: string;
  /** False for providers that must never run in production. */
  readonly isProductionSafe: boolean;

  /** Build the authorization redirect for a fresh sign-in attempt. */
  createAuthorizationRequest(redirectUri: string): Promise<AuthorizationRequest>;

  /**
   * Exchange the authorization code for a profile. Implementations must not
   * persist or return provider access tokens beyond what they need here — we
   * deliberately keep no long-lived credential for the user.
   */
  completeAuthorization(input: {
    code: string;
    redirectUri: string;
    codeVerifier: string;
  }): Promise<ExternalProfile>;
}

/** Thrown for any failure a user could plausibly cause or need explained. */
export class AuthError extends Error {
  constructor(
    message: string,
    readonly code:
      | "provider_error"
      | "invalid_state"
      | "not_a_student"
      | "exchange_failed"
      | "profile_failed"
      | "disabled",
  ) {
    super(message);
    this.name = "AuthError";
  }
}
