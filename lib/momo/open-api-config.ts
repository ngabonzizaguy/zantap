import "server-only";

export type MomoOpenApiEnvironment = "sandbox" | "mtnrwanda";

export type MomoOpenApiProduct = "collection" | "disbursement";

export interface MomoOpenApiConfig {
  environment: MomoOpenApiEnvironment;
  baseUrl: string;
  /**
   * Async callback URL for Collection/Transfer.
   * Sandbox often rejects public tunnels (ngrok) with HTTP 500 — leave empty
   * in sandbox and poll MoMo status instead. Required for production.
   */
  webhookUrl: string | null;
  currency: "EUR" | "RWF";
  targetEnvironment: string;
  /** Sandbox-only MSISDN that always succeeds for Collection. */
  sandboxSuccessMsisdn: string;
  collection: {
    primaryKey: string;
    userId: string;
    apiKey: string;
  };
  disbursement: {
    primaryKey: string;
    userId: string;
    apiKey: string;
  };
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required MoMo Open API env: ${name}`);
  }
  return value;
}

/**
 * Reads MoMo Open API credentials from the environment.
 * Sandbox forces EUR + X-Target-Environment `sandbox` (MTN constraint).
 */
export function getMomoOpenApiConfig(): MomoOpenApiConfig {
  const environment = (process.env.MOMO_ENVIRONMENT?.trim().toLowerCase() ||
    "sandbox") as MomoOpenApiEnvironment;

  const isSandbox = environment !== "mtnrwanda";

  // Sandbox + ngrok (and many tunnels) make MoMo return 500 on requesttopay
  // when X-Callback-Url is set. Skip callback in sandbox; poll status instead.
  // Production always sends the webhook URL.
  const webhookRaw = process.env.MOMO_WEBHOOK_URL?.trim() || "";
  const webhookUrl = isSandbox
    ? null
    : webhookRaw ||
      (() => {
        throw new Error("Missing required MoMo Open API env: MOMO_WEBHOOK_URL");
      })();

  return {
    environment: isSandbox ? "sandbox" : "mtnrwanda",
    baseUrl: (
      process.env.MOMO_BASE_URL?.trim() ||
      (isSandbox
        ? "https://sandbox.momodeveloper.mtn.com"
        : "https://proxy.momoapi.mtn.com")
    ).replace(/\/$/, ""),
    webhookUrl,
    currency: isSandbox ? "EUR" : "RWF",
    targetEnvironment: isSandbox ? "sandbox" : "mtnrwanda",
    sandboxSuccessMsisdn: "56733123453",
    collection: {
      primaryKey: requireEnv("MOMO_COLLECTION_PRIMARY_KEY"),
      userId: requireEnv("MOMO_COLLECTION_USER_ID"),
      apiKey: requireEnv("MOMO_COLLECTION_API_KEY"),
    },
    disbursement: {
      primaryKey: requireEnv("MOMO_DISBURSEMENT_PRIMARY_KEY"),
      userId: requireEnv("MOMO_DISBURSEMENT_USER_ID"),
      apiKey: requireEnv("MOMO_DISBURSEMENT_API_KEY"),
    },
  };
}

export function isMomoOpenApiConfigured(): boolean {
  try {
    getMomoOpenApiConfig();
    return true;
  } catch {
    return false;
  }
}
