import { NextResponse } from "next/server";
import { requireRestaurantAdmin } from "@/lib/auth-server";
import { requireRestaurantFeature } from "@/lib/feature-access";
import { restaurantService } from "@/lib/services/restaurant.service";
import { reservationService } from "@/lib/services/reservation.service";

export async function GET(request: Request) {
  const { admin, error } = await requireRestaurantAdmin();
  if (error) return error;
  const restaurant = await restaurantService.getById(admin.restaurantId);
  if (!restaurant) return NextResponse.json({ success: false, error: "Restaurant not found" }, { status: 404 });
  const feature = requireRestaurantFeature(restaurant, "RESERVATIONS");
  if (!feature.allowed) return NextResponse.json({ success: false, error: feature.reason }, { status: 403 });
  const date = new URL(request.url).searchParams.get("date") ?? undefined;
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ success: false, error: "Date must use YYYY-MM-DD." }, { status: 400 });
  try {
    return NextResponse.json({ success: true, data: await reservationService.list(admin.restaurantId, date) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to load reservations." }, { status: 500 });
  }
}
