import { NextResponse } from "next/server";
import { restaurantService } from "@/lib/services/restaurant.service";
import {
  restaurantAdminProfileSchema,
  updateRestaurantSchema,
} from "@/lib/validations";
import {
  forbiddenResponse,
  getAdminContext,
  requireRestaurantAdmin,
  requireSuperAdmin,
  unauthorizedResponse,
} from "@/lib/auth-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  try {
    const { restaurantId } = await params;
    const { searchParams } = new URL(request.url);
    const fullMenu = searchParams.get("fullMenu") === "true";

    if (fullMenu) {
      const menu = await restaurantService.getFullMenu(restaurantId);
      if (!menu) {
        return NextResponse.json(
          { success: false, error: "Restaurant not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, data: menu });
    }

    const admin = await getAdminContext();
    if (!admin) return unauthorizedResponse();
    if (
      admin.role === "RESTAURANT_ADMIN" &&
      restaurantId !== admin.restaurantId
    ) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 },
      );
    }

    const restaurant = await restaurantService.getById(restaurantId);
    if (!restaurant || restaurant.isActive === false) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: restaurant });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch restaurant";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  try {
    let admin = await getAdminContext();
    if (!admin) return unauthorizedResponse();
    if (admin.role === "RESTAURANT_ADMIN") {
      const { admin: restaurantAdmin, error } = await requireRestaurantAdmin();
      if (error) return error;
      admin = restaurantAdmin;
    }
    const { restaurantId } = await params;
    if (
      admin.role === "RESTAURANT_ADMIN" &&
      restaurantId !== admin.restaurantId
    ) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 },
      );
    }
    if (admin.role !== "SUPER_ADMIN" && admin.role !== "RESTAURANT_ADMIN") {
      return forbiddenResponse();
    }
    const body = await request.json();
    if (
      admin.role === "RESTAURANT_ADMIN" &&
      ("slug" in body || "isActive" in body)
    ) {
      return forbiddenResponse();
    }
    const validated =
      admin.role === "SUPER_ADMIN"
        ? updateRestaurantSchema.parse(body)
        : restaurantAdminProfileSchema.parse(body);
    const updated = await restaurantService.update(restaurantId, validated);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
        { status: 400 },
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to update restaurant";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ restaurantId: string }> },
) {
  try {
    const { error } = await requireSuperAdmin();
    if (error) return error;
    const { restaurantId } = await params;
    const result = await restaurantService.delete(restaurantId);
    if (!result.deleted) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({
      success: true,
      data: { message: "Restaurant deleted successfully" },
    });
  } catch (error) {
    console.error("Restaurant deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Restaurant deletion failed" },
      { status: 500 },
    );
  }
}
