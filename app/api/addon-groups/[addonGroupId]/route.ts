import { NextResponse } from "next/server";
import { addonService } from "@/lib/services/addon.service";
import { updateAddonGroupSchema } from "@/lib/validations";
import { requireRestaurantAdmin } from "@/lib/auth-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ addonGroupId: string }> },
) {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;
    const { addonGroupId } = await params;
    const group = await addonService.getGroupById(addonGroupId);
    if (!group || group.restaurantId !== admin.restaurantId) {
      return NextResponse.json(
        { success: false, error: "Addon group not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch addon group";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ addonGroupId: string }> },
) {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;
    const { addonGroupId } = await params;
    const existing = await addonService.getGroupById(addonGroupId);
    if (!existing || existing.restaurantId !== admin.restaurantId) {
      return NextResponse.json(
        { success: false, error: "Addon group not found" },
        { status: 404 },
      );
    }
    const body = await request.json();
    const validated = updateAddonGroupSchema.parse(body);
    const updated = await addonService.updateGroup(addonGroupId, validated);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Addon group not found" },
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
      error instanceof Error ? error.message : "Failed to update addon group";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ addonGroupId: string }> },
) {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;
    const { addonGroupId } = await params;
    const existing = await addonService.getGroupById(addonGroupId);
    if (!existing || existing.restaurantId !== admin.restaurantId) {
      return NextResponse.json(
        { success: false, error: "Addon group not found" },
        { status: 404 },
      );
    }
    const deleted = await addonService.deleteGroup(addonGroupId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Addon group not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Addon group deleted successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete addon group";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
