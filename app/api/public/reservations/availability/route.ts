import { NextResponse } from "next/server";
import { requireRestaurantFeature } from "@/lib/feature-access";
import { reservationAvailabilitySchema } from "@/lib/validations";
import { restaurantService } from "@/lib/services/restaurant.service";
import { reservationService, ReservationServiceError } from "@/lib/services/reservation.service";

export async function POST(request: Request) {
  try {
    const input = reservationAvailabilitySchema.parse(await request.json());
    const restaurant = await restaurantService.getBySlug(input.slug);
    if (!restaurant || restaurant.isActive === false) return NextResponse.json({ success: false, error: "Restaurant not found" }, { status: 404 });
    const feature = requireRestaurantFeature(restaurant, "RESERVATIONS");
    if (!feature.allowed) return NextResponse.json({ success: false, error: feature.reason }, { status: 403 });
    const data = await reservationService.availability(restaurant.id, input);
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const validation = error && typeof error === "object" && "issues" in error;
    return NextResponse.json({ success: false, error: validation ? "Invalid reservation search." : error instanceof ReservationServiceError ? error.message : "Unable to check availability." }, { status: validation ? 400 : error instanceof ReservationServiceError ? error.statusCode : 500, headers: { "Cache-Control": "no-store" } });
  }
}
