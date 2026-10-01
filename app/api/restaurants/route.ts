import { NextResponse } from "next/server";
import { restaurantService } from "@/lib/services/restaurant.service";
import { restaurantSchema } from "@/lib/validations";
import {
  getAdminContext,
  requireSuperAdmin,
  unauthorizedResponse,
} from "@/lib/auth-server";

export async function GET() {
  try {
    const admin = await getAdminContext();
    if (!admin) return unauthorizedResponse();
    const restaurants =
      admin.role === "SUPER_ADMIN"
        ? await restaurantService.getAll()
        : admin.restaurantId
          ? [await restaurantService.getById(admin.restaurantId)].filter(
              (restaurant) => restaurant !== null,
            )
          : [];
    return NextResponse.json({ success: true, data: restaurants });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch restaurants";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { error } = await requireSuperAdmin();
    if (error) return error;
    const body = await request.json();
    const validated = restaurantSchema.parse(body);
    const newRestaurant = await restaurantService.create(validated);
    return NextResponse.json(
      { success: true, data: newRestaurant },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to create restaurant";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
