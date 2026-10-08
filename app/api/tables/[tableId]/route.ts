import { NextResponse } from "next/server";
import { requireRestaurantAdmin } from "@/lib/auth-server";
import { tableService, TableServiceError } from "@/lib/services/table.service";
import { restaurantService } from "@/lib/services/restaurant.service";
import { updateTableSchema } from "@/lib/validations";
import { requireRestaurantFeature } from "@/lib/feature-access";

type RouteContext = { params: Promise<{ tableId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;
    const { tableId } = await params;

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

    const input = updateTableSchema.parse(await request.json());
    const table = await tableService.update(admin.restaurantId, tableId, input);
    if (!table)
      return NextResponse.json(
        { success: false, error: "Table not found." },
        { status: 404 },
      );
    return NextResponse.json({ success: true, data: table });
  } catch (error) {
    const validation = error && typeof error === "object" && "issues" in error;
    const duplicate =
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000;
    return NextResponse.json(
      {
        success: false,
        error: validation
          ? "Validation failed"
          : error instanceof TableServiceError
            ? error.message
            : duplicate
              ? "A table with this number already exists."
              : "Unable to update table.",
      },
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

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;
    const { tableId } = await params;

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

    const result = await tableService.delete(admin.restaurantId, tableId);
    if (!result.deleted) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.reason === "HAS_REFERENCES"
              ? "This table has order or reservation history and cannot be deleted. Deactivate it instead."
              : "Table not found.",
        },
        { status: result.reason === "HAS_REFERENCES" ? 409 : 404 },
      );
    }
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to delete table." },
      { status: 500 },
    );
  }
}
