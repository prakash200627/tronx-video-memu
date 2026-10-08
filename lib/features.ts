import type { FeatureKey, SubscriptionPlan } from "@/types";

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlan, FeatureKey[]> = {
  STARTER: [
    "VIDEO_MENU",
    "TABLE_MANAGEMENT",
    "TABLE_ORDERING",
    "ORDER_MANAGEMENT",
    "MEDIA_LIBRARY",
  ],
  PRO: [
    "VIDEO_MENU",
    "TABLE_MANAGEMENT",
    "TABLE_ORDERING",
    "ORDER_MANAGEMENT",
    "MEDIA_LIBRARY",
    "RESERVATIONS",
    "CAPTAIN_ACCESS",
  ],
  ENTERPRISE: [
    "VIDEO_MENU",
    "TABLE_MANAGEMENT",
    "TABLE_ORDERING",
    "ORDER_MANAGEMENT",
    "MEDIA_LIBRARY",
    "RESERVATIONS",
    "CAPTAIN_ACCESS",
    "WIFI",
    "CUSTOM_THEME",
    "ANALYTICS",
  ],
};

export const DEFAULT_PLAN: SubscriptionPlan = "PRO";

export function getRestaurantPlan(restaurant: { subscriptionPlan?: SubscriptionPlan }): SubscriptionPlan {
  return restaurant.subscriptionPlan ?? DEFAULT_PLAN;
}

export function hasRestaurantFeature(
  restaurant: { subscriptionPlan?: SubscriptionPlan; subscriptionEnabled?: boolean; featureOverrides?: Record<string, boolean> },
  featureKey: FeatureKey
): boolean {
  if (restaurant.subscriptionEnabled === false) return false;
  const plan = restaurant.subscriptionPlan ?? DEFAULT_PLAN;
  const planFeatures = PLAN_ENTITLEMENTS[plan] ?? PLAN_ENTITLEMENTS[DEFAULT_PLAN];

  const override = restaurant.featureOverrides?.[featureKey];
  if (typeof override === "boolean") {
    return override;
  }

  return planFeatures.includes(featureKey);
}

