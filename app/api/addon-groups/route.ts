import { NextResponse } from "next/server";
import { addonService } from "@/lib/services/addon.service";
import { addonGroupSchema } from "@/lib/validations";
import { requireRestaurantAdmin } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    if (!restaurantId || restaurantId !== admin.restaurantId) {
      return NextResponse.json(
        { success: false, error: "Restaurant not found" },
        { status: 404 },
      );
    }
    const groups = await addonService.getGroupsByRestaurantId(restaurantId);
    return NextResponse.json({ success: true, data: groups });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch addon groups";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;
    const body = await request.json();
    const validated = addonGroupSchema.parse({
      ...body,
      restaurantId: admin.restaurantId,
    });
    const newGroup = await addonService.createGroup(validated);
    return NextResponse.json(
      { success: true, data: newGroup },
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
      error instanceof Error ? error.message : "Failed to create addon group";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
