/**
 * Prisma client singleton.
 *
 * Runs against Neon Postgres through Prisma's driver adapter rather than
 * Prisma's default query engine, because the default engine relies on a
 * native binary that cannot load in Cloudflare Workers' V8-isolate runtime
 * (no filesystem / native binaries there). The Neon adapter talks to the
 * database over HTTP/WebSocket instead, which works in Workers, Vercel edge
 * functions, and plain Node.js alike.
 *
 * Imported from "@prisma/client/wasm" specifically (not the plain
 * "@prisma/client" entry point): Prisma picks its Node vs. Workers client
 * via package.json conditional exports ("node" vs. "workerd"), but Next.js's
 * own build resolves that with the "node" condition before Cloudflare's
 * bundler ever sees it, which silently bakes in the filesystem-based client
 * (the one that tries to fs.readFileSync a .wasm file that doesn't exist at
 * runtime on Workers). The "/wasm" subpath is unconditional, so it always
 * loads the WASM query compiler via a proper import instead.
 *
 * Next.js dev-mode module reloading would otherwise open a new connection
 * pool on every edit, so the instance is cached on globalThis outside
 * production.
 */
import { PrismaClient } from "@prisma/client/wasm";
import { PrismaNeon } from "@prisma/adapter-neon";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
