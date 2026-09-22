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
    // Default vitest excludes. Preserved continuity trees under
    // `.scratch/repository-continuity/preserved-*` stay INCLUDED (owner
    // decision 2026-09-22) so agents/CI can pick up the KDS translation
    // contract from those docs+tests. Keep their `*.test.ts` files synced
    // with live expectations when product behavior changes — see README there.
    exclude: ["**/node_modules/**", "**/dist/**"],
    // Load .env (DATABASE_URL/DIRECT_URL/TEST_DATABASE_URL) into process.env;
    // empty prefix pulls non-VITE_ vars too. vitest does not do this on its own.
    env: {
      ...loadEnv(mode, process.cwd(), ""),
      // #prisma — skip remote contract suite by default (egress / pooler stalls).
      SKIP_PRISMA_TESTS: process.env.SKIP_PRISMA_TESTS ?? "1",
      // `.env.production.local` (pulled by Vercel CLI) sets VERCEL=1, which makes
      // menu-intake blob helpers throw in unit tests. Local vitest is never on
      // Vercel — clear it so the suite stays green without a manual unset.
      VERCEL: "",
    },
    // The Prisma integration suite hits a remote database: schema push and
    // per-test reseeds need more than vitest's 10s/5s defaults. In-memory
    // tests are unaffected.
    hookTimeout: 90000,
    testTimeout: 30000,
  },
}));
