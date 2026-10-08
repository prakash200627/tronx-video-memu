import { NextResponse } from "next/server";
import { requireRestaurantAdmin } from "@/lib/auth-server";
import { requireRestaurantFeature } from "@/lib/feature-access";
import { restaurantService } from "@/lib/services/restaurant.service";
import { reservationService, ReservationServiceError } from "@/lib/services/reservation.service";
import { updateReservationStatusSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ reservationId: string }> };

async function authorize() {
  const { admin, error } = await requireRestaurantAdmin();
  if (error) return { admin: null, error } as const;
  const restaurant = await restaurantService.getById(admin.restaurantId);
  if (!restaurant) return { admin: null, error: NextResponse.json({ success: false, error: "Restaurant not found" }, { status: 404 }) } as const;
  const feature = requireRestaurantFeature(restaurant, "RESERVATIONS");
  if (!feature.allowed) return { admin: null, error: NextResponse.json({ success: false, error: feature.reason }, { status: 403 }) } as const;
  return { admin, error: null } as const;
}

export async function GET(_request: Request, context: RouteContext) {
  const { admin, error } = await authorize();
  if (error) return error;
  const { reservationId } = await context.params;
  const reservation = await reservationService.get(admin.restaurantId, reservationId);
  return reservation ? NextResponse.json({ success: true, data: reservation }, { headers: { "Cache-Control": "no-store" } }) : NextResponse.json({ success: false, error: "Reservation not found." }, { status: 404 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { admin, error } = await authorize();
  if (error) return error;
  const parsed = updateReservationStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid reservation status." }, { status: 400 });
  try {
    const { reservationId } = await context.params;
    const reservation = await reservationService.updateStatus(admin.restaurantId, reservationId, parsed.data.status);
    return reservation ? NextResponse.json({ success: true, data: reservation }) : NextResponse.json({ success: false, error: "Reservation not found or status changed. Refresh and try again." }, { status: 404 });
  } catch (cause) {
    return NextResponse.json({ success: false, error: cause instanceof ReservationServiceError ? cause.message : "Unable to update reservation." }, { status: cause instanceof ReservationServiceError ? cause.statusCode : 500 });
  }
}
