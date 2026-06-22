import type {
  ConfirmPinRequest,
  StkPushRequest,
  StkPushResponse,
} from "@/lib/types";

const STK_ENDPOINT = "/api/momo/stk";

export interface MomoClient {
  initiateStkPush(body: StkPushRequest): Promise<StkPushResponse>;
  confirmStkPin(body: ConfirmPinRequest): Promise<StkPushResponse>;
}

async function postStk(
  fetchFn: typeof fetch,
  body: StkPushRequest | ConfirmPinRequest | { action: "confirm"; token: string; pin: string }
): Promise<StkPushResponse> {
  const response = await fetchFn(STK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json() as Promise<StkPushResponse>;
}

export function createMomoClient(fetchFn: typeof fetch = fetch): MomoClient {
  return {
    initiateStkPush: (body) => postStk(fetchFn, body),
    confirmStkPin: (body) =>
      postStk(fetchFn, { action: "confirm", token: body.token, pin: body.pin }),
  };
}

export const defaultMomoClient = createMomoClient();
