/**
 * Provider selection. One place decides which identity provider is live, so
 * activating real Ion sign-in is a change to AUTH_PROVIDER and two secrets.
 */
import { env, isProduction } from "../env";
import { DevAuthProvider } from "./dev";
import { IonAuthProvider } from "./ion";
import type { AuthProvider } from "./provider";

let cached: AuthProvider | undefined;

export function authProvider(): AuthProvider {
  if (!cached) {
    cached = env.AUTH_PROVIDER === "ion" ? new IonAuthProvider() : new DevAuthProvider();
    if (isProduction && !cached.isProductionSafe) {
      throw new Error(`Auth provider "${cached.id}" is not permitted in production.`);
    }
  }
  return cached;
}

/** Absolute redirect URI registered with the provider. */
export function callbackUrl(): string {
  return new URL("/api/auth/callback", env.APP_URL).toString();
}

export * from "./provider";
