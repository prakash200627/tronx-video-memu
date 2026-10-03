import { NextResponse } from "next/server";
import { orderService } from "@/lib/services/order.service";

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const authorization = request.headers.get("authorization") ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) return NextResponse.json({ success: false, error: "A valid order token is required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    const order = await orderService.getCustomerStatus(orderId, token);
    if (!order) return NextResponse.json({ success: false, error: "A valid order token is required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ success: true, data: order }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to check order status." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
