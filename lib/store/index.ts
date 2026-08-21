import "server-only";

import { createInMemoryStore } from "@/lib/store/in-memory";
import { createPrismaStore } from "@/lib/store/prisma";
import type { Store } from "@/lib/store/types";

export type { Store } from "@/lib/store/types";

// One Store per process. Stored on globalThis so Next.js dev hot-reload does
// not spin up a fresh (empty) Store on every module re-evaluation — otherwise
// an Order placed before a reload would vanish from the KDS.
const globalForStore = globalThis as unknown as {
  __zantapStore?: Store;
};

/**
 * The single entry point to the Store. Callers (Server Actions and RSC) ask
 * for the Store here; they never construct an adapter themselves. The Prisma
 * adapter is chosen automatically when a database is configured
 * (`DATABASE_URL`), and the in-memory adapter otherwise — so local dev and CI
 * need no extra wiring. Tests force a specific adapter by constructing it
 * directly rather than going through this factory.
 */
export function getStore(): Store {
  const cached = globalForStore.__zantapStore;
  if (cached && typeof cached.getVendorUpdateOverview === "function") {
    return cached;
  }
  const store = process.env.DATABASE_URL
    ? createPrismaStore()
    : createInMemoryStore();
  globalForStore.__zantapStore = store;
  return store;
}
