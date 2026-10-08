import type { Restaurant } from "@/types";

export function normalizeRestaurant(restaurant: Restaurant): Restaurant {
  const source = restaurant && typeof restaurant === "object" && "toObject" in restaurant && typeof restaurant.toObject === "function"
    ? restaurant.toObject({ flattenMaps: true }) as Record<string, unknown>
    : restaurant as unknown as Record<string, unknown>;
  const publicRestaurant = toPlainObject(source) as unknown as Restaurant;
  delete publicRestaurant.wifi;
  const logoUrl = publicRestaurant.logoUrl ?? publicRestaurant.logo;
  const coverUrl = publicRestaurant.coverUrl ?? publicRestaurant.coverImage;

  return {
    ...publicRestaurant,
    logo: restaurant.logo ?? logoUrl,
    coverImage: restaurant.coverImage ?? coverUrl,
    logoUrl,
    coverUrl,
  };
}

function toPlainObject(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== "_id" && key !== "__v")
    .map(([key, entry]) => [key, toPlainValue(entry)]));
}

function toPlainValue(value: unknown): unknown {
  if (value instanceof Map) return Object.fromEntries([...value.entries()].map(([key, entry]) => [String(key), toPlainValue(entry)]));
  if (Array.isArray(value)) return value.map(toPlainValue);
  if (!value || typeof value !== "object" || value instanceof Date) return value;
  if ("toHexString" in value && typeof value.toHexString === "function") return value.toHexString();
  if ("toObject" in value && typeof value.toObject === "function") {
    return toPlainValue(value.toObject({ flattenMaps: true }));
  }
  return toPlainObject(value as Record<string, unknown>);
}
