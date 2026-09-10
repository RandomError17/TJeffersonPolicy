/**
 * Prisma client singleton.
 *
 * Next.js dev-mode module reloading would otherwise open a new connection pool
 * on every edit, so the instance is cached on globalThis outside production.
 */
import { PrismaClient } from "@prisma/client";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
