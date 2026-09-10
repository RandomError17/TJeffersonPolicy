import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // lib/env.ts validates configuration at import time, so the suite needs a
    // valid environment even though it never opens a database connection.
    // Vitest also loads the developer's .env, so anything the suite asserts on
    // is pinned here explicitly — otherwise a local OFFICER_USERNAMES would
    // change the result of a test.
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "file:./test.db",
      APP_URL: "http://localhost:3000",
      SESSION_SECRET: "test-secret-value-that-is-long-enough-to-pass-validation",
      AUTH_PROVIDER: "dev",
      OFFICER_USERNAMES: "",
      BOOTSTRAP_OFFICER_USERNAMES: "",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // `server-only` throws on import outside a React Server Component. The
      // modules under test are server code; stubbing the marker lets them be
      // unit tested without a Next runtime.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
});
