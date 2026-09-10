/**
 * Test stub for the `server-only` marker package.
 *
 * In the app it exists purely to make a build fail if server code is imported
 * into a client bundle. Under vitest there is no such boundary, so it is a
 * no-op — the guarantee is enforced at build time by `npm run build`, not here.
 */
export {};
