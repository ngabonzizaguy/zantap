import { NextResponse } from "next/server";
import { confirmStkPin, initiateStkPush } from "@/lib/momo/simulate";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "confirm") {
      const result = await confirmStkPin({
        token: body.token,
        pin: body.pin,
      });
      return NextResponse.json(result);
    }

    const result = await initiateStkPush({
      orderId: body.orderId,
      phone: body.phone,
      amount: body.amount,
      vendorName: body.vendorName,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "MoMo simulation failed";
    return NextResponse.json({ status: "FAILED", message }, { status: 400 });
  }
}
