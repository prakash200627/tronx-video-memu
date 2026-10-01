import { NextResponse } from "next/server";
import { addonService } from "@/lib/services/addon.service";
import { addonSchema } from "@/lib/validations";
import { requireRestaurantAdmin } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;
    const { searchParams } = new URL(request.url);
    const addonGroupId = searchParams.get("addonGroupId");

    if (!addonGroupId) {
      return NextResponse.json(
        { success: false, error: "Query param 'addonGroupId' is required" },
        { status: 400 },
      );
    }

    const group = await addonService.getGroupById(addonGroupId);
    if (!group || group.restaurantId !== admin.restaurantId) {
      return NextResponse.json(
        { success: false, error: "Add-on group not found" },
        { status: 404 },
      );
    }

    const addons = await addonService.getAddonsByGroupId(addonGroupId);
    return NextResponse.json({ success: true, data: addons });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch addons";
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
    const validated = addonSchema.parse(body);
    const group = await addonService.getGroupById(validated.addonGroupId);
    if (!group || group.restaurantId !== admin.restaurantId) {
      return NextResponse.json(
        { success: false, error: "Add-on group not found" },
        { status: 404 },
      );
    }
    const newAddon = await addonService.createAddon(validated);
    return NextResponse.json(
      { success: true, data: newAddon },
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
      error instanceof Error ? error.message : "Failed to create addon";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}
