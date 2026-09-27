import type {
  CollectionPaymentStatusResponse,
  ConfirmPinRequest,
  StkPushRequest,
  StkPushResponse,
} from "@/lib/types";

const STK_ENDPOINT = "/api/momo/stk";
const COLLECTION_ENDPOINT = "/api/momo/collection";

export interface MomoClient {
  initiateStkPush(body: StkPushRequest): Promise<StkPushResponse>;
  confirmStkPin(body: ConfirmPinRequest): Promise<StkPushResponse>;
  /** Open API Collection requesttopay (MOMO_MODE=openapi). */
  initiateCollection(body: StkPushRequest): Promise<StkPushResponse>;
  /** Poll Collection Payment status while awaiting MoMo prompt approval. */
  getCollectionStatus(
    orderId: string
  ): Promise<CollectionPaymentStatusResponse>;
}

async function postStk(
  fetchFn: typeof fetch,
  body:
    | StkPushRequest
    | ConfirmPinRequest
    | { action: "confirm"; token: string; pin: string }
): Promise<StkPushResponse> {
  const response = await fetchFn(STK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json() as Promise<StkPushResponse>;
}

async function postCollection(
  fetchFn: typeof fetch,
  body: StkPushRequest
): Promise<StkPushResponse> {
  const response = await fetchFn(COLLECTION_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json() as Promise<StkPushResponse>;
}

async function getCollection(
  fetchFn: typeof fetch,
  orderId: string
): Promise<CollectionPaymentStatusResponse> {
  const url = `${COLLECTION_ENDPOINT}?orderId=${encodeURIComponent(orderId)}`;
  const response = await fetchFn(url, { method: "GET" });
  return response.json() as Promise<CollectionPaymentStatusResponse>;
}

export function createMomoClient(fetchFn: typeof fetch = fetch): MomoClient {
  return {
    initiateStkPush: (body) => postStk(fetchFn, body),
    confirmStkPin: (body) =>
      postStk(fetchFn, { action: "confirm", token: body.token, pin: body.pin }),
    initiateCollection: (body) => postCollection(fetchFn, body),
    getCollectionStatus: (orderId) => getCollection(fetchFn, orderId),
  };
}

export const defaultMomoClient = createMomoClient();
