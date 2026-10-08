import { notFound } from "next/navigation";
import MediaManager from "@/components/admin/MediaManager";
import { mediaService } from "@/lib/services/media.service";
import type { Media } from "@/types";
import { restaurantService } from "@/lib/services/restaurant.service";
import { requireRestaurantFeature } from "@/lib/feature-access";

export const dynamic = "force-dynamic";

export default async function RestaurantMediaSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await restaurantService.getBySlug(slug);
  if (!restaurant || !requireRestaurantFeature(restaurant, "MEDIA_LIBRARY").allowed) notFound();
  let initialMedia: Media[] = [];
  let initialError: string | null = null;

  try {
    initialMedia = await mediaService.getByRestaurantId(slug);
  } catch (error) {
    initialError =
      error instanceof Error ? error.message : "Failed to load media";
  }

  return (
    <MediaManager
      initialMedia={initialMedia}
      initialError={initialError}
      restaurantId={slug}
    />
  );
}
