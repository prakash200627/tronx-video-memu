import { restaurantRepository } from "@/lib/repositories/restaurant.repository";
import { categoryRepository } from "@/lib/repositories/category.repository";
import { dishRepository } from "@/lib/repositories/dish.repository";
import { addonRepository } from "@/lib/repositories/addon.repository";
import type { Restaurant, RestaurantMenu } from "@/types";
import type {
  CreateRestaurantInput,
  UpdateRestaurantInput,
} from "@/lib/validations";
import { resolveDishAddonGroups } from "@/lib/dish-addons";
import { normalizeRestaurant } from "@/lib/restaurant-normalize";
import type { RestaurantDeleteResult } from "@/lib/repositories/types";
import { mediaRepository } from "@/lib/repositories/media.repository";
import cloudinary from "@/lib/cloudinary";

export class RestaurantService {
  async getAll(): Promise<Restaurant[]> {
    return restaurantRepository.findAll();
  }

  async getById(id: string): Promise<Restaurant | null> {
    const restaurant = await restaurantRepository.findById(id);
    return restaurant ? normalizeRestaurant(restaurant) : null;
  }

  async getBySlug(slug: string): Promise<Restaurant | null> {
    return restaurantRepository.findBySlug(slug);
  }

  async create(input: CreateRestaurantInput): Promise<Restaurant> {
    const existing = await restaurantRepository.findBySlug(input.slug);
    if (existing) {
      throw new Error(`A restaurant with slug '${input.slug}' already exists`);
    }
    return restaurantRepository.create(input);
  }

  async update(
    id: string,
    input: UpdateRestaurantInput,
  ): Promise<Restaurant | null> {
    if (input.slug) {
      const existing = await restaurantRepository.findBySlug(input.slug);
      if (existing && existing.id !== id) {
        throw new Error(
          `Slug '${input.slug}' is already taken by another restaurant`,
        );
      }
    }
    const patch: UpdateRestaurantInput & Partial<Restaurant> = { ...input };
    if (patch.logoUrl !== undefined) patch.logo = patch.logoUrl;
    if (patch.coverUrl !== undefined) patch.coverImage = patch.coverUrl;
    if (patch.logo !== undefined) patch.logoUrl = patch.logo;
    if (patch.coverImage !== undefined) patch.coverUrl = patch.coverImage;

    if (patch.slug && patch.slug !== id) {
      return restaurantRepository.renameIdentity(id, patch.slug, patch);
    }

    const updated = await restaurantRepository.update(id, patch);
    return updated ? normalizeRestaurant(updated) : null;
  }

  async delete(id: string): Promise<RestaurantDeleteResult> {
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) return { deleted: false, reason: "NOT_FOUND" };

    const media = await mediaRepository.findByRestaurantId(id);
    for (const asset of media) {
      if (asset.isExternal) continue;
      const result = await cloudinary.uploader.destroy(asset.publicId, {
        resource_type: asset.resourceType,
        invalidate: true,
      });
      if (result.result !== "ok" && result.result !== "not found") {
        throw new Error(`Cloudinary deletion failed: ${result.result}`);
      }
    }

    return restaurantRepository.delete(id);
  }

  async getFullMenu(idOrSlug: string): Promise<RestaurantMenu | null> {
    let restaurant = await restaurantRepository.findById(idOrSlug);
    if (!restaurant) {
      restaurant = await restaurantRepository.findBySlug(idOrSlug);
    }
    if (!restaurant) return null;
    if (restaurant.isActive === false) return null;

    const [categories, rawDishes, addonGroups] = await Promise.all([
      categoryRepository.findByRestaurantId(restaurant.id),
      dishRepository.findByRestaurantId(restaurant.id),
      addonRepository.findGroupsByRestaurantId(restaurant.id),
    ]);

    const dishes = rawDishes.map((dish) => ({
      ...dish,
      addonGroups: resolveDishAddonGroups(dish, addonGroups),
    }));

    return {
      restaurant: normalizeRestaurant(restaurant),
      categories: categories.filter((c) => c.isActive),
      dishes,
    };
  }
}

export const restaurantService = new RestaurantService();
