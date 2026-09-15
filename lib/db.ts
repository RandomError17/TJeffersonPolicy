/**
 * Prisma client access.
 *
 * Two Cloudflare Workers constraints shape this file.
 *
 * 1. Engine. Prisma's default query engine is a native binary, which cannot
 *    load in the Workers V8 runtime. Queries therefore go through a driver
 *    adapter (Neon over WebSocket, so interactive transactions keep working)
 *    against the WASM engine that `engineType = "wasm"` generates.
 *
 * 2. Connection lifetime. Workers forbid reusing a socket opened during one
 *    request in a later one: the second request's query never completes and
 *    the runtime eventually cancels it as a hung response. A module-level
 *    client is therefore unsafe here, because its pooled connection outlives
 *    the request that opened it. Instead each request gets its own client,
 *    keyed on the per-request Cloudflare context, and the connection is
 *    closed once the response has been sent.
 *
 * Outside Workers (next build, tests, `next dev` under Node) there is no such
 * restriction and a single long-lived client is the right thing — it avoids
 * opening a connection per render.
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { after } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { env } from "./env";

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Clients belonging to an in-flight request, keyed by its context object. */
const requestClients = new WeakMap<object, PrismaClient>();

/**
 * The per-request context object, or undefined when not running inside a
 * Workers request (e.g. during the build, or under plain Node).
 */
function requestScope(): object | undefined {
  try {
    const context = getCloudflareContext();
    return (context?.ctx as object | undefined) ?? undefined;
  } catch {
    // Not inside a Workers request (build, tests, plain Node).
    return undefined;
  }
}

/** Schedule cleanup of a request-scoped client once the response is sent. */
function disconnectAfterResponse(client: PrismaClient) {
  try {
    after(() => client.$disconnect().catch(() => {}));
  } catch {
    // Not in a context that supports `after` — the isolate will reclaim the
    // connection when it is torn down.
  }
}

function resolveClient(): PrismaClient {
  const scope = requestScope();

  if (!scope) {
    return (globalForPrisma.prisma ??= createPrismaClient());
  }

  let client = requestClients.get(scope);
  if (!client) {
    client = createPrismaClient();
    requestClients.set(scope, client);
    disconnectAfterResponse(client);
  }
  return client;
}

/**
 * Behaves like a `PrismaClient`, but resolves to the correct instance for the
 * current request. Call sites are unchanged: `prisma.user.findMany()` works
 * exactly as before.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = resolveClient();
    const value = Reflect.get(client as object, property, client);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
}) as PrismaClient;
