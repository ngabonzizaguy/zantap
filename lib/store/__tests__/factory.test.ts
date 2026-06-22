import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getStore } from "@/lib/store";

/**
 * The factory picks its adapter from the environment alone: Prisma when
 * `DATABASE_URL` is configured, in-memory otherwise. This runs with no database
 * — constructing either adapter never opens a connection, so we can assert the
 * selection itself. The two adapters are told apart by the in-memory adapter's
 * test-only `reset` hook, which the Prisma adapter deliberately lacks.
 */
const globalForStore = globalThis as unknown as { __zantapStore?: unknown };

function isInMemoryAdapter(store: unknown): boolean {
  return typeof (store as { reset?: unknown }).reset === "function";
}

describe("getStore factory adapter selection", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    // The factory memoizes one Store per process; clear it so each case selects
    // fresh from the environment.
    delete globalForStore.__zantapStore;
  });

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    delete globalForStore.__zantapStore;
  });

  it("returns the in-memory adapter when DATABASE_URL is unset", () => {
    delete process.env.DATABASE_URL;
    expect(isInMemoryAdapter(getStore())).toBe(true);
  });

  it("returns the Prisma adapter when DATABASE_URL is set", () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/zantap";
    expect(isInMemoryAdapter(getStore())).toBe(false);
  });

  it("memoizes a single Store instance per process", () => {
    delete process.env.DATABASE_URL;
    expect(getStore()).toBe(getStore());
  });
});
