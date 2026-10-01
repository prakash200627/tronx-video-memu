import { NextResponse } from "next/server";
import { categoryService } from "@/lib/services/category.service";
import { categorySchema } from "@/lib/validations";
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
    const categories = await categoryService.getByRestaurantId(restaurantId);
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch categories";
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
    const validated = categorySchema.parse({
      ...body,
      restaurantId: admin.restaurantId,
    });
    const newCategory = await categoryService.create(validated);
    return NextResponse.json(
      { success: true, data: newCategory },
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
      error instanceof Error ? error.message : "Failed to create category";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
