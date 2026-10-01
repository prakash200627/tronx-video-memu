import { NextResponse } from "next/server";
import { addonService } from "@/lib/services/addon.service";
import { updateAddonSchema } from "@/lib/validations";
import { requireRestaurantAdmin } from "@/lib/auth-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ addonId: string }> },
) {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;
    const { addonId } = await params;
    const addon = await addonService.getAddonById(addonId);
    if (!addon) {
      return NextResponse.json(
        { success: false, error: "Addon not found" },
        { status: 404 },
      );
    }
    const group = await addonService.getGroupById(addon.addonGroupId || "");
    if (!group || group.restaurantId !== admin.restaurantId) {
      return NextResponse.json(
        { success: false, error: "Addon not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: addon });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch addon";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ addonId: string }> },
) {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;
    const { addonId } = await params;
    const existing = await addonService.getAddonById(addonId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Addon not found" },
        { status: 404 },
      );
    }
    const group = await addonService.getGroupById(existing.addonGroupId || "");
    if (!group || group.restaurantId !== admin.restaurantId) {
      return NextResponse.json(
        { success: false, error: "Addon not found" },
        { status: 404 },
      );
    }
    const body = await request.json();
    const validated = updateAddonSchema.parse(body);
    const updated = await addonService.updateAddon(addonId, validated);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Addon not found" },
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
      error instanceof Error ? error.message : "Failed to update addon";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ addonId: string }> },
) {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;
    const { addonId } = await params;
    const existing = await addonService.getAddonById(addonId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Addon not found" },
        { status: 404 },
      );
    }
    const group = await addonService.getGroupById(existing.addonGroupId || "");
    if (!group || group.restaurantId !== admin.restaurantId) {
      return NextResponse.json(
        { success: false, error: "Addon not found" },
        { status: 404 },
      );
    }
    const deleted = await addonService.deleteAddon(addonId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Addon not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Addon deleted successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete addon";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
