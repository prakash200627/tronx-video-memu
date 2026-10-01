import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { dishService } from "@/lib/services/dish.service";
import { mediaService } from "@/lib/services/media.service";
import { requireRestaurantAdmin } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ mediaId: string }> },
) {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;
    const { mediaId } = await params;
    const media = await mediaService.getById(mediaId);

    if (!media) {
      return NextResponse.json(
        { success: false, error: "Media not found" },
        { status: 404 },
      );
    }
    if (media.restaurantId !== admin.restaurantId) {
      return NextResponse.json(
        { success: false, error: "Media not found" },
        { status: 404 },
      );
    }

    const isReferenced = await dishService.hasMediaReference(
      admin.restaurantId,
      media.url,
    );
    if (isReferenced) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Media is still used by a dish. Update the dish before deleting it.",
        },
        { status: 409 },
      );
    }

    if (!media.isExternal) {
      const cloudinaryResult = await cloudinary.uploader.destroy(
        media.publicId,
        {
          resource_type: media.resourceType,
          invalidate: true,
        },
      );

      if (cloudinaryResult.result !== "ok") {
        throw new Error(
          `Cloudinary deletion failed: ${cloudinaryResult.result}`,
        );
      }
    }

    const deleted = await mediaService.delete(mediaId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Media record could not be deleted" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Media deleted successfully" },
    });
  } catch (error) {
    console.error("Media deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Media deletion failed. Please try again." },
      { status: 500 },
    );
  }
}
