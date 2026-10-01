import type { Restaurant } from "@/types";

export function normalizeRestaurant(restaurant: Restaurant): Restaurant {
  const logoUrl = restaurant.logoUrl ?? restaurant.logo;
  const coverUrl = restaurant.coverUrl ?? restaurant.coverImage;

  return {
    ...restaurant,
    logo: restaurant.logo ?? logoUrl,
    coverImage: restaurant.coverImage ?? coverUrl,
    logoUrl,
    coverUrl,
  };
}
