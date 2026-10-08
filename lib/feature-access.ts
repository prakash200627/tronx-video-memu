import "server-only";

import type { FeatureKey, Restaurant } from "@/types";
import { PLAN_ENTITLEMENTS, DEFAULT_PLAN, getRestaurantPlan, hasRestaurantFeature } from "@/lib/features";

export { getRestaurantPlan, hasRestaurantFeature };

export function requireRestaurantFeature(
  restaurant: Restaurant,
  featureKey: FeatureKey,
): { allowed: true } | { allowed: false; reason: string } {
  if (hasRestaurantFeature(restaurant, featureKey)) {
    return { allowed: true };
  }

  const plan = getRestaurantPlan(restaurant);
  return {
    allowed: false,
    reason: `The '${featureKey}' feature is not available on your ${plan} plan. Please upgrade to access this feature.`,
  };
}

export function getAllRestaurantFeatures(restaurant: Restaurant): Record<FeatureKey, boolean> {
  const plan = getRestaurantPlan(restaurant);
  const planFeatures = PLAN_ENTITLEMENTS[plan] ?? PLAN_ENTITLEMENTS[DEFAULT_PLAN];

  const features: Record<FeatureKey, boolean> = {
    VIDEO_MENU: false,
    TABLE_MANAGEMENT: false,
    TABLE_ORDERING: false,
    ORDER_MANAGEMENT: false,
    MEDIA_LIBRARY: false,
    RESERVATIONS: false,
    CAPTAIN_ACCESS: false,
    WIFI: false,
    CUSTOM_THEME: false,
    ANALYTICS: false,
  };

  for (const key of Object.keys(features) as FeatureKey[]) {
    if (restaurant.subscriptionEnabled === false) {
      features[key] = false;
      continue;
    }
    const override = restaurant.featureOverrides?.[key];
    if (typeof override === "boolean") {
      features[key] = override;
    } else {
      features[key] = planFeatures.includes(key);
    }
  }

  return features;
}
