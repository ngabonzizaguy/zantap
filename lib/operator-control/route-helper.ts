import { assertOperatorApiKey } from "@/lib/operator-control/assert-operator-api-key";
import { operatorError } from "@/lib/operator-control/http";

export async function withOperatorAuth(
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    assertOperatorApiKey(request.headers.get("authorization"));
    return await handler();
  } catch (error) {
    return operatorError(error);
  }
}

export function readSearchParam(
  url: URL,
  key: string
): string | undefined {
  const value = url.searchParams.get(key);
  return value?.trim() || undefined;
}
