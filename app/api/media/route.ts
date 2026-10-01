import { NextResponse } from "next/server";
import { mediaService } from "@/lib/services/media.service";
import { requireRestaurantAdmin } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const media = await mediaService.getByRestaurantId(admin.restaurantId);

    return NextResponse.json({ success: true, data: media });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch media";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
