import { resolve } from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      "server-only": resolve(__dirname, "test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    // Load .env (DATABASE_URL/DIRECT_URL/TEST_DATABASE_URL) into process.env;
    // empty prefix pulls non-VITE_ vars too. vitest does not do this on its own.
    env: {
      ...loadEnv(mode, process.cwd(), ""),
      // #prisma — skip remote contract suite by default (egress / pooler stalls).
      SKIP_PRISMA_TESTS: process.env.SKIP_PRISMA_TESTS ?? "1",
    },
    // The Prisma integration suite hits a remote database: schema push and
    // per-test reseeds need more than vitest's 10s/5s defaults. In-memory
    // tests are unaffected.
    hookTimeout: 90000,
    testTimeout: 30000,
  },
}));
