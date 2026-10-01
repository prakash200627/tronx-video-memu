import { NextResponse } from "next/server";
import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import cloudinary from "@/lib/cloudinary";
import { mediaService } from "@/lib/services/media.service";
import type { MediaResourceType } from "@/types";
import { requireRestaurantAdmin } from "@/lib/auth-server";

export const runtime = "nodejs";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;
    const formData = await request.formData();

    const file = formData.get("file");
    const restaurantId = admin.restaurantId;

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "Restaurant context is missing" },
        { status: 400 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    if (!allowedMimeTypes.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only JPG, PNG, WebP, MP4, WebM, and MOV files are allowed",
        },
        { status: 400 },
      );
    }

    const maxSize = file.type.startsWith("video/")
      ? MAX_VIDEO_SIZE_BYTES
      : MAX_IMAGE_SIZE_BYTES;
    if (file.size === 0 || file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `File is empty or exceeds the ${file.type.startsWith("video/") ? "100 MB video" : "10 MB image"} limit`,
        },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `tronx/${restaurantId}/media`,
          resource_type: "auto",
        },
        (
          error: UploadApiErrorResponse | undefined,
          result?: UploadApiResponse,
        ) => {
          if (error) {
            reject(error);
          } else if (!result) {
            reject(new Error("Cloudinary returned no upload result"));
          } else {
            resolve(result);
          }
        },
      );

      uploadStream.end(buffer);
    });
    const resourceType: MediaResourceType =
      result.resource_type === "raw" ||
      result.resource_type === "image" ||
      result.resource_type === "video"
        ? result.resource_type
        : file.type.startsWith("video/")
          ? "video"
          : "image";

    let media;
    try {
      media = await mediaService.createRecord({
        restaurantId,
        type: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
        url: result.secure_url,
        publicId: result.public_id,
        resourceType,
        format: result.format,
        width: result.width,
        height: result.height,
        duration: result.duration,
      });
    } catch (error) {
      try {
        await cloudinary.uploader.destroy(result.public_id, {
          resource_type: resourceType,
          invalidate: true,
        });
      } catch (cleanupError) {
        console.error("Media upload cleanup error:", cleanupError);
      }
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        data: media,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Media upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Media upload failed. Please try again.",
      },
      { status: 500 },
    );
  }
}
