import "server-only";

import { PrismaClient } from "@prisma/client";

// A single PrismaClient per process. Next.js dev hot-reload re-evaluates modules
// repeatedly; without this guard each reload would open a new pool of database
// connections and quickly exhaust Postgres. Stored on globalThis so the same
// instance survives module re-evaluation.
const globalForPrisma = globalThis as unknown as {
  __zantapPrisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.__zantapPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__zantapPrisma = prisma;
}
