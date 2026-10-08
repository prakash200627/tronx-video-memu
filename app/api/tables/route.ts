import { NextResponse } from "next/server";
import { requireRestaurantAdmin } from "@/lib/auth-server";
import { tableService, TableServiceError } from "@/lib/services/table.service";
import { restaurantService } from "@/lib/services/restaurant.service";
import { createTableSchema } from "@/lib/validations";
import { requireRestaurantFeature } from "@/lib/feature-access";

export async function GET() {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;

    const restaurant = await restaurantService.getById(admin.restaurantId);
    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 },
      );
    }

    const featureCheck = requireRestaurantFeature(
      restaurant,
      "TABLE_MANAGEMENT",
    );
    if (!featureCheck.allowed) {
      return NextResponse.json(
        { success: false, error: featureCheck.reason },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: await tableService.list(admin.restaurantId),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load tables." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;

    const restaurant = await restaurantService.getById(admin.restaurantId);
    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 },
      );
    }

    const featureCheck = requireRestaurantFeature(
      restaurant,
      "TABLE_MANAGEMENT",
    );
    if (!featureCheck.allowed) {
      return NextResponse.json(
        { success: false, error: featureCheck.reason },
        { status: 403 },
      );
    }

    const input = createTableSchema.parse(await request.json());
    const table = await tableService.create(admin.restaurantId, input);
    return NextResponse.json({ success: true, data: table }, { status: 201 });
  } catch (error) {
    const validation = error && typeof error === "object" && "issues" in error;
    const duplicate =
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000;
    const message =
      error instanceof TableServiceError
        ? error.message
        : duplicate
          ? "A table with this number already exists."
          : "Unable to create table.";
    return NextResponse.json(
      { success: false, error: validation ? "Validation failed" : message },
      {
        status: validation
          ? 400
          : error instanceof TableServiceError || duplicate
            ? 409
            : 500,
      },
    );
  }
}
