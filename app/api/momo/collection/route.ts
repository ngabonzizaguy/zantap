import { NextResponse } from "next/server";
import {
  initiateOpenApiCollection,
  syncCollectionPaymentFromProvider,
} from "@/lib/momo/open-api-collection";
import { getMomoMode } from "@/lib/momo/mode";

/**
 * Poll Collection Payment status for the storefront awaiting sheet.
 * Query: ?orderId=
 * Returns { status: PENDING | SUCCESS | FAILED | NOT_FOUND } — no secrets.
 * When still PENDING, also asks MoMo (sandbox has no reliable webhook).
 */
export async function GET(request: Request) {
  if (getMomoMode() !== "openapi") {
    return NextResponse.json(
      {
        status: "NOT_FOUND",
        message: "Open API Collection requires MOMO_MODE=openapi",
      },
      { status: 400 },
    );
  }

  const orderId = new URL(request.url).searchParams.get("orderId")?.trim();
  if (!orderId) {
    return NextResponse.json(
      { status: "NOT_FOUND", message: "orderId is required" },
      { status: 400 },
    );
  }

  const status = await syncCollectionPaymentFromProvider(orderId);
  return NextResponse.json({ status });
}

/**
 * Start MoMo Open API Collection (requesttopay).
 * Body: { orderId, phone, amount, vendorName? }
 */
export async function POST(request: Request) {
  if (getMomoMode() !== "openapi") {
    return NextResponse.json(
      {
        status: "FAILED",
        message: "Open API Collection requires MOMO_MODE=openapi",
      },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json()) as {
      orderId?: string;
      phone?: string;
      amount?: number;
      vendorName?: string;
    };

    if (!body.orderId || !body.phone || typeof body.amount !== "number") {
      return NextResponse.json(
        {
          status: "FAILED",
          message: "orderId, phone, and amount are required",
        },
        { status: 400 },
      );
    }

    const result = await initiateOpenApiCollection({
      orderId: body.orderId,
      customerPhone: body.phone,
      amount: body.amount,
      vendorName: body.vendorName,
    });

    if (!result.ok) {
      return NextResponse.json(
        { token: "", status: "FAILED", message: result.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      token: result.referenceId,
      status: result.paymentStatus,
      message: result.message,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "MoMo Collection failed";
    return NextResponse.json({ status: "FAILED", message }, { status: 500 });
  }
}
