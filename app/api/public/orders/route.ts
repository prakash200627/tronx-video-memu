import { NextResponse } from "next/server";
import { placeOrderSchema } from "@/lib/validations";
import { orderService, OrderServiceError } from "@/lib/services/order.service";

export async function POST(request: Request) {
  try {
    const input = placeOrderSchema.parse(await request.json());
    const result = await orderService.createPublic(input);
    return NextResponse.json({ success: true, data: result }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const validation = error && typeof error === "object" && "issues" in error;
    const duplicate = error && typeof error === "object" && "code" in error && error.code === 11000;
    const message = error instanceof OrderServiceError ? error.message : "Unable to place your order. Please try again.";
    return NextResponse.json(
      { success: false, error: validation ? "Your cart is invalid. Please review it." : duplicate ? "This order was already submitted." : message },
      { status: validation ? 400 : error instanceof OrderServiceError ? error.statusCode : duplicate ? 409 : 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
