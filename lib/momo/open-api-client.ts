import "server-only";
import { randomUUID } from "node:crypto";
import {
  getMomoOpenApiConfig,
  type MomoOpenApiConfig,
  type MomoOpenApiProduct,
} from "@/lib/momo/open-api-config";
import { sanitizeMomoNote } from "@/lib/momo/open-api-notes";

export type MomoPartyIdType = "MSISDN" | "PARTY_CODE";

export type MomoAsyncStatus =
  | "PENDING"
  | "SUCCESSFUL"
  | "FAILED"
  | "REJECTED"
  | "TIMEOUT";

export interface MomoParty {
  partyIdType: MomoPartyIdType;
  partyId: string;
}

export interface RequestToPayInput {
  amount: number | string;
  /** Merchant / order correlation id (our Order id). */
  externalId: string;
  payer: MomoParty;
  payerMessage?: string;
  payeeNote?: string;
  /** Defaults to a fresh UUIDv4 — becomes Payment.transactionRef. */
  referenceId?: string;
  callbackUrl?: string;
}

export interface TransferInput {
  amount: number | string;
  externalId: string;
  /** Dynamic payee: phone wallet or merchant/party code. */
  payee: MomoParty;
  payerMessage?: string;
  payeeNote?: string;
  referenceId?: string;
  callbackUrl?: string;
}

export interface PreapprovalInput {
  payer: MomoParty;
  payerCurrency?: string;
  externalId: string;
  payerMessage?: string;
  validityTime?: number;
  referenceId?: string;
  callbackUrl?: string;
}

export interface MomoAcceptedReference {
  referenceId: string;
  status: 202;
}

export interface MomoTransactionStatus {
  referenceId?: string;
  financialTransactionId?: string;
  externalId?: string;
  amount?: string;
  currency?: string;
  status: MomoAsyncStatus | string;
  reason?: string;
  payer?: MomoParty;
  payee?: MomoParty;
}

type TokenCacheEntry = {
  accessToken: string;
  /** Epoch ms when we should refresh (before real expiry). */
  expiresAtMs: number;
};

const tokenCache: Partial<Record<MomoOpenApiProduct, TokenCacheEntry>> = {};

/** Refresh 60s before the stated 3600s lifetime. */
const TOKEN_REFRESH_SKEW_MS = 60_000;
const TOKEN_TTL_MS = 3600_000;

function basicAuthHeader(userId: string, apiKey: string): string {
  const raw = Buffer.from(`${userId}:${apiKey}`, "utf8").toString("base64");
  return `Basic ${raw}`;
}

function productCredentials(
  config: MomoOpenApiConfig,
  product: MomoOpenApiProduct,
) {
  return product === "collection" ? config.collection : config.disbursement;
}

function tokenPath(product: MomoOpenApiProduct): string {
  return product === "collection"
    ? "/collection/token/"
    : "/disbursement/token/";
}

export class MomoOpenApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
    this.name = "MomoOpenApiError";
  }
}

export function createMomoOpenApiClient(options?: {
  config?: MomoOpenApiConfig;
  fetchFn?: typeof fetch;
  /** Injected clock for token-cache tests. */
  now?: () => number;
}) {
  const fetchFn = options?.fetchFn ?? fetch;
  const now = options?.now ?? Date.now;
  const resolveConfig = () => options?.config ?? getMomoOpenApiConfig();

  async function getAccessToken(
    product: MomoOpenApiProduct,
  ): Promise<string> {
    const cached = tokenCache[product];
    if (cached && cached.expiresAtMs > now()) {
      return cached.accessToken;
    }

    const config = resolveConfig();
    const creds = productCredentials(config, product);
    const res = await fetchFn(`${config.baseUrl}${tokenPath(product)}`, {
      method: "POST",
      headers: {
        Authorization: basicAuthHeader(creds.userId, creds.apiKey),
        "Ocp-Apim-Subscription-Key": creds.primaryKey,
      },
    });

    const bodyText = await res.text();
    if (!res.ok) {
      throw new MomoOpenApiError(
        `MoMo ${product} token failed (${res.status})`,
        res.status,
        bodyText,
      );
    }

    let parsed: { access_token?: string; expires_in?: number };
    try {
      parsed = JSON.parse(bodyText) as {
        access_token?: string;
        expires_in?: number;
      };
    } catch {
      throw new MomoOpenApiError(
        `MoMo ${product} token returned non-JSON`,
        res.status,
        bodyText,
      );
    }

    if (!parsed.access_token) {
      throw new MomoOpenApiError(
        `MoMo ${product} token missing access_token`,
        res.status,
        bodyText,
      );
    }

    const ttlMs =
      typeof parsed.expires_in === "number" && parsed.expires_in > 0
        ? parsed.expires_in * 1000
        : TOKEN_TTL_MS;

    tokenCache[product] = {
      accessToken: parsed.access_token,
      expiresAtMs: now() + Math.max(1_000, ttlMs - TOKEN_REFRESH_SKEW_MS),
    };

    return parsed.access_token;
  }

  async function authorizedHeaders(
    product: MomoOpenApiProduct,
    referenceId: string,
    callbackUrl?: string,
  ): Promise<Record<string, string>> {
    const config = resolveConfig();
    const creds = productCredentials(config, product);
    const token = await getAccessToken(product);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": config.targetEnvironment,
      "Ocp-Apim-Subscription-Key": creds.primaryKey,
      "Content-Type": "application/json",
    };
    const callback = callbackUrl ?? config.webhookUrl ?? undefined;
    if (callback) {
      headers["X-Callback-Url"] = callback;
    }
    return headers;
  }

  async function postAccepted(
    product: MomoOpenApiProduct,
    path: string,
    referenceId: string,
    payload: unknown,
    callbackUrl?: string,
  ): Promise<MomoAcceptedReference> {
    const config = resolveConfig();
    const headers = await authorizedHeaders(product, referenceId, callbackUrl);
    const res = await fetchFn(`${config.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const bodyText = await res.text();
    // MoMo returns 202 Accepted with an empty body on success.
    if (res.status !== 202) {
      throw new MomoOpenApiError(
        `MoMo ${product} ${path} failed (${res.status})`,
        res.status,
        bodyText,
      );
    }
    return { referenceId, status: 202 };
  }

  async function getResourceStatus(
    product: MomoOpenApiProduct,
    path: string,
    referenceId: string,
  ): Promise<MomoTransactionStatus> {
    const config = resolveConfig();
    const creds = productCredentials(config, product);
    const token = await getAccessToken(product);
    const res = await fetchFn(`${config.baseUrl}${path}/${referenceId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Target-Environment": config.targetEnvironment,
        "Ocp-Apim-Subscription-Key": creds.primaryKey,
      },
    });
    const bodyText = await res.text();
    if (!res.ok) {
      throw new MomoOpenApiError(
        `MoMo ${product} status failed (${res.status})`,
        res.status,
        bodyText,
      );
    }
    return JSON.parse(bodyText) as MomoTransactionStatus;
  }

  function amountString(amount: number | string): string {
    if (typeof amount === "number") {
      if (!Number.isFinite(amount) || amount < 0) {
        throw new Error("MoMo amount must be a non-negative finite number");
      }
      // Sandbox EUR and prod RWF both accept whole units as decimal strings.
      return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
    }
    return amount.trim();
  }

  return {
    /** Test helper — clears in-memory bearer tokens. */
    clearTokenCache() {
      delete tokenCache.collection;
      delete tokenCache.disbursement;
    },

    getAccessToken,

    async requestToPay(input: RequestToPayInput): Promise<MomoAcceptedReference> {
      const config = resolveConfig();
      const referenceId = input.referenceId ?? randomUUID();
      return postAccepted(
        "collection",
        "/collection/v1_0/requesttopay",
        referenceId,
        {
          amount: amountString(input.amount),
          currency: config.currency,
          externalId: input.externalId,
          payer: input.payer,
          payerMessage: sanitizeMomoNote(
            input.payerMessage ?? "ZanTap order",
          ),
          payeeNote: sanitizeMomoNote(input.payeeNote ?? "ZanTap order"),
        },
        input.callbackUrl,
      );
    },

    async getRequestToPayStatus(
      referenceId: string,
    ): Promise<MomoTransactionStatus> {
      return getResourceStatus(
        "collection",
        "/collection/v1_0/requesttopay",
        referenceId,
      );
    },

    /**
     * Vendor payout. `payee.partyIdType` is MSISDN (phone) or PARTY_CODE
     * (merchant / MoMo Pay code).
     */
    async transfer(input: TransferInput): Promise<MomoAcceptedReference> {
      const config = resolveConfig();
      const referenceId = input.referenceId ?? randomUUID();
      return postAccepted(
        "disbursement",
        "/disbursement/v1_0/transfer",
        referenceId,
        {
          amount: amountString(input.amount),
          currency: config.currency,
          externalId: input.externalId,
          payee: input.payee,
          payerMessage: sanitizeMomoNote(
            input.payerMessage ?? "ZanTap payout",
          ),
          payeeNote: sanitizeMomoNote(input.payeeNote ?? "ZanTap payout"),
        },
        input.callbackUrl,
      );
    },

    async getTransferStatus(
      referenceId: string,
    ): Promise<MomoTransactionStatus> {
      return getResourceStatus(
        "disbursement",
        "/disbursement/v1_0/transfer",
        referenceId,
      );
    },

    /**
     * Subscription / recurring pre-approval (Collection v2).
     * Product wiring is deferred (ADR-0096) — HTTP client only.
     */
    async createPreapproval(
      input: PreapprovalInput,
    ): Promise<MomoAcceptedReference> {
      const config = resolveConfig();
      const referenceId = input.referenceId ?? randomUUID();
      return postAccepted(
        "collection",
        "/collection/v2_0/preapproval",
        referenceId,
        {
          payer: input.payer,
          payerCurrency: input.payerCurrency ?? config.currency,
          externalId: input.externalId,
          payerMessage: sanitizeMomoNote(
            input.payerMessage ?? "ZanTap subscription",
          ),
          ...(input.validityTime != null
            ? { validityTime: input.validityTime }
            : {}),
        },
        input.callbackUrl,
      );
    },
  };
}

export type MomoOpenApiClient = ReturnType<typeof createMomoOpenApiClient>;

let defaultClient: MomoOpenApiClient | null = null;

export function getMomoOpenApiClient(): MomoOpenApiClient {
  if (!defaultClient) {
    defaultClient = createMomoOpenApiClient();
  }
  return defaultClient;
}
