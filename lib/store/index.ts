import "server-only";

import { createInMemoryStore } from "@/lib/store/in-memory";
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
 * for the Store here; they never construct an adapter themselves. Issue 03
 * extends this factory to pick the Prisma adapter when a database is
 * configured — for now it always returns the in-memory adapter.
 */
export function getStore(): Store {
  if (!globalForStore.__zantapStore) {
    globalForStore.__zantapStore = createInMemoryStore();
  }
  return globalForStore.__zantapStore;
}
