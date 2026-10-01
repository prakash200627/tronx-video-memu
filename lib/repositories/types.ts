import type {
  Restaurant,
  Category,
  Dish,
  AddonGroup,
  Addon,
  Media,
} from "@/types";

export interface IRestaurantRepository {
  findAll(): Promise<Restaurant[]>;
  findById(id: string): Promise<Restaurant | null>;
  findBySlug(slug: string): Promise<Restaurant | null>;
  create(
    data: Omit<Restaurant, "id" | "createdAt" | "updatedAt">,
  ): Promise<Restaurant>;
  update(id: string, data: Partial<Restaurant>): Promise<Restaurant | null>;
  delete(id: string): Promise<RestaurantDeleteResult>;
}

export type RestaurantDeleteResult =
  | { deleted: true }
  | { deleted: false; reason: "NOT_FOUND" };

export interface ICategoryRepository {
  findByRestaurantId(restaurantId: string): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  create(
    data: Omit<Category, "id" | "createdAt" | "updatedAt">,
  ): Promise<Category>;
  update(id: string, data: Partial<Category>): Promise<Category | null>;
  delete(id: string): Promise<boolean>;
}

export interface IDishRepository {
  findByRestaurantId(restaurantId: string): Promise<Dish[]>;
  findByCategoryId(categoryId: string): Promise<Dish[]>;
  hasMediaReference(restaurantId: string, mediaUrl: string): Promise<boolean>;
  findById(id: string): Promise<Dish | null>;
  create(data: Omit<Dish, "id" | "createdAt" | "updatedAt">): Promise<Dish>;
  update(id: string, data: Partial<Dish>): Promise<Dish | null>;
  delete(id: string): Promise<boolean>;
}

export interface IAddonRepository {
  findGroupsByRestaurantId(restaurantId: string): Promise<AddonGroup[]>;
  findGroupById(id: string): Promise<AddonGroup | null>;
  createGroup(
    data: Omit<AddonGroup, "id" | "addons" | "createdAt" | "updatedAt">,
  ): Promise<AddonGroup>;
  updateGroup(
    id: string,
    data: Partial<AddonGroup>,
  ): Promise<AddonGroup | null>;
  deleteGroup(id: string): Promise<boolean>;

  findAddonsByGroupId(groupId: string): Promise<Addon[]>;
  findAddonById(id: string): Promise<Addon | null>;
  createAddon(
    data: Omit<Addon, "id" | "createdAt" | "updatedAt">,
  ): Promise<Addon>;
  updateAddon(id: string, data: Partial<Addon>): Promise<Addon | null>;
  deleteAddon(id: string): Promise<boolean>;
}

export interface IMediaRepository {
  findByRestaurantId(restaurantId: string): Promise<Media[]>;
  findById(id: string): Promise<Media | null>;
  create(data: Omit<Media, "id" | "createdAt" | "updatedAt">): Promise<Media>;
  delete(id: string): Promise<boolean>;
}
