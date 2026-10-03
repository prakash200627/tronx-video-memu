import { NextResponse } from "next/server";
import { requireRestaurantAdmin } from "@/lib/auth-server";
import { orderService } from "@/lib/services/order.service";

export async function GET() {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;
    const orders = await orderService.listForRestaurant(admin.restaurantId);
    return NextResponse.json({ success: true, data: orders }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to load orders." }, { status: 500 });
  }
}
