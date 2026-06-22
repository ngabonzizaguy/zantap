import { execSync } from "node:child_process";
import { afterAll, beforeAll, describe } from "vitest";
import { PrismaClient } from "@prisma/client";

import { createPrismaStore } from "@/lib/store/prisma";
import type { ResettableStore } from "@/lib/store/types";
import { seedDatabase } from "@/prisma/seed";
import { runStoreContract } from "@/lib/store/__tests__/contract";

/**
 * The same Store contract suite, run against the Prisma adapter on a disposable
 * test database, proving the in-memory and Prisma adapters cannot drift.
 *
 * Point `TEST_DATABASE_URL` at a throwaway Postgres database to enable it; the
 * suite pushes the schema, then reseeds before each test via the adapter's
 * reset hook. When the variable is absent (unit-speed local runs, CI without a
 * database) the whole suite is skipped.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

let client: PrismaClient;

describe.skipIf(!TEST_DATABASE_URL)("Prisma adapter (integration)", () => {
  beforeAll(() => {
    const url = TEST_DATABASE_URL as string;

    // Bring the disposable database up to the current schema. --accept-data-loss
    // is safe here precisely because the target is a throwaway test database.
    execSync("npx prisma db push --skip-generate --accept-data-loss", {
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
      stdio: "inherit",
    });

    client = new PrismaClient({ datasources: { db: { url } } });
  });

  afterAll(async () => {
    await client?.$disconnect();
  });

  runStoreContract("prisma adapter", (): ResettableStore => {
    const base = createPrismaStore(client);
    return { ...base, reset: () => seedDatabase(client) };
  });
});
