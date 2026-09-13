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
 * Next.js dev-mode module reloading would otherwise open a new connection
 * pool on every edit, so the instance is cached on globalThis outside
 * production.
 */
import { PrismaClient } from "@prisma/client";
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
