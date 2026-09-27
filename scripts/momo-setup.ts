/**
 * One-off MTN MoMo sandbox provisioning.
 *
 * Creates Collection + Disbursement API users and API keys via:
 *   POST /v1_0/apiuser
 *   POST /v1_0/apiuser/{uuid}/apikey
 *
 * Reads Step-1 vars from `.env`, then upserts:
 *   MOMO_COLLECTION_USER_ID / MOMO_COLLECTION_API_KEY
 *   MOMO_DISBURSEMENT_USER_ID / MOMO_DISBURSEMENT_API_KEY
 *
 * Usage: npm run momo:setup
 *
 * Re-run only when rotating users/keys or changing providerCallbackHost
 * (ngrok host). Existing USER_ID/API_KEY values are overwritten.
 */

import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ENV_PATH = resolve(process.cwd(), ".env");

type Product = "collection" | "disbursement";

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) {
    throw new Error(`Missing ${path}. Create it from .env.example first.`);
  }
  const out: Record<string, string> = {};
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function upsertEnv(path: string, updates: Record<string, string>): void {
  let text = existsSync(path) ? readFileSync(path, "utf8") : "";
  for (const [key, value] of Object.entries(updates)) {
    const entry = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    if (re.test(text)) {
      text = text.replace(re, entry);
    } else {
      if (text.length && !text.endsWith("\n")) text += "\n";
      text += `${entry}\n`;
    }
  }
  writeFileSync(path, text, "utf8");
}

function requireEnv(env: Record<string, string>, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required env ${key}. Complete Step 1 before momo:setup.`);
  }
  return value;
}

function callbackHostFromWebhookUrl(webhookUrl: string): string {
  let url: URL;
  try {
    url = new URL(webhookUrl);
  } catch {
    throw new Error(`MOMO_WEBHOOK_URL is not a valid URL: ${webhookUrl}`);
  }
  // MoMo wants host only — no scheme, path, or trailing slash.
  return url.hostname;
}

async function createApiUser(opts: {
  baseUrl: string;
  subscriptionKey: string;
  providerCallbackHost: string;
  referenceId: string;
}): Promise<void> {
  const res = await fetch(`${opts.baseUrl}/v1_0/apiuser`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Reference-Id": opts.referenceId,
      "Ocp-Apim-Subscription-Key": opts.subscriptionKey,
    },
    body: JSON.stringify({ providerCallbackHost: opts.providerCallbackHost }),
  });
  if (res.status !== 201 && res.status !== 200) {
    const body = await res.text();
    throw new Error(
      `Create apiuser failed (${res.status}): ${body || res.statusText}`,
    );
  }
}

async function createApiKey(opts: {
  baseUrl: string;
  subscriptionKey: string;
  userId: string;
}): Promise<string> {
  const res = await fetch(`${opts.baseUrl}/v1_0/apiuser/${opts.userId}/apikey`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": opts.subscriptionKey,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Create apikey failed (${res.status}): ${body || res.statusText}`,
    );
  }
  const json = (await res.json()) as { apiKey?: string };
  if (!json.apiKey) {
    throw new Error("Create apikey response missing apiKey field.");
  }
  return json.apiKey;
}

async function provisionProduct(
  product: Product,
  opts: {
    baseUrl: string;
    subscriptionKey: string;
    providerCallbackHost: string;
  },
): Promise<{ userId: string; apiKey: string }> {
  const userId = randomUUID();
  console.log(`[momo:setup] ${product}: creating apiuser ${userId}…`);
  await createApiUser({
    baseUrl: opts.baseUrl,
    subscriptionKey: opts.subscriptionKey,
    providerCallbackHost: opts.providerCallbackHost,
    referenceId: userId,
  });
  console.log(`[momo:setup] ${product}: creating apikey…`);
  const apiKey = await createApiKey({
    baseUrl: opts.baseUrl,
    subscriptionKey: opts.subscriptionKey,
    userId,
  });
  console.log(`[momo:setup] ${product}: ok`);
  return { userId, apiKey };
}

async function main(): Promise<void> {
  const env = loadEnvFile(ENV_PATH);
  const baseUrl = requireEnv(env, "MOMO_BASE_URL").replace(/\/$/, "");
  const webhookUrl = requireEnv(env, "MOMO_WEBHOOK_URL");
  const providerCallbackHost = callbackHostFromWebhookUrl(webhookUrl);
  const collectionKey = requireEnv(env, "MOMO_COLLECTION_PRIMARY_KEY");
  const disbursementKey = requireEnv(env, "MOMO_DISBURSEMENT_PRIMARY_KEY");

  console.log(`[momo:setup] baseUrl=${baseUrl}`);
  console.log(`[momo:setup] providerCallbackHost=${providerCallbackHost}`);

  const collection = await provisionProduct("collection", {
    baseUrl,
    subscriptionKey: collectionKey,
    providerCallbackHost,
  });
  const disbursement = await provisionProduct("disbursement", {
    baseUrl,
    subscriptionKey: disbursementKey,
    providerCallbackHost,
  });

  upsertEnv(ENV_PATH, {
    MOMO_COLLECTION_USER_ID: collection.userId,
    MOMO_COLLECTION_API_KEY: collection.apiKey,
    MOMO_DISBURSEMENT_USER_ID: disbursement.userId,
    MOMO_DISBURSEMENT_API_KEY: disbursement.apiKey,
  });

  console.log("");
  console.log("[momo:setup] Wrote to .env:");
  console.log(`  MOMO_COLLECTION_USER_ID=${collection.userId}`);
  console.log(`  MOMO_COLLECTION_API_KEY=<set, ${collection.apiKey.length} chars>`);
  console.log(`  MOMO_DISBURSEMENT_USER_ID=${disbursement.userId}`);
  console.log(`  MOMO_DISBURSEMENT_API_KEY=<set, ${disbursement.apiKey.length} chars>`);
  console.log("");
  console.log(
    "[momo:setup] STOP — confirm .env looks right, then tell the agent to continue Step 3.",
  );
}

main().catch((err) => {
  console.error("[momo:setup] FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
