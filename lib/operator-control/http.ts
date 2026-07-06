import { NextResponse } from "next/server";
import { OperatorApiKeyError } from "@/lib/operator-control/assert-operator-api-key";

export function operatorJson<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function operatorError(error: unknown): NextResponse {
  if (error instanceof OperatorApiKeyError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}
