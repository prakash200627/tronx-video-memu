import type { AddonGroup, Dish } from "@/types";

/** Resolve addon groups explicitly linked to a dish (never all restaurant groups). */
export function resolveDishAddonGroups(
  dish: Dish,
  allGroups: AddonGroup[],
): AddonGroup[] {
  const ids =
    dish.addonGroupIds && dish.addonGroupIds.length > 0
      ? dish.addonGroupIds
      : (dish.addonGroups?.map((g) => g.id) ?? []);

  if (ids.length === 0) return [];

  const groupById = new Map(allGroups.map((g) => [g.id, g]));

  return ids
    .map((id) => groupById.get(id))
    .filter((g): g is AddonGroup => Boolean(g))
    .filter((g) => g.isActive !== false)
    .map((group) => ({
      ...group,
      addons: [...group.addons]
        .filter((a) => a.isAvailable !== false && a.isActive !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    }));
}
