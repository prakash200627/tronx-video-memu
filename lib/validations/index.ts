import { z } from "zod";

// --- RESTAURANT SCHEMAS ---
const socialLinksSchema = z
  .object({
    instagram: z.string().trim().optional(),
    facebook: z.string().trim().optional(),
    twitter: z.string().trim().optional(),
    website: z.string().trim().optional(),
  })
  .optional();

export const restaurantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Restaurant name must be at least 2 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must only contain lowercase letters, numbers, and hyphens",
    ),
  logo: z.string().trim().optional(),
  coverImage: z.string().trim().optional(),
  logoUrl: z.string().trim().optional(),
  coverUrl: z.string().trim().optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
  tagline: z
    .string()
    .trim()
    .max(200, "Tagline cannot exceed 200 characters")
    .optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  address: z.string().trim().optional(),
  openingHours: z.string().trim().optional(),
  currency: z.string().trim().max(10).optional(),
  socialLinks: socialLinksSchema,
  isOpen: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export const updateRestaurantSchema = restaurantSchema.partial();
export const restaurantAdminProfileSchema = updateRestaurantSchema.omit({
  slug: true,
  isActive: true,
});
export type CreateRestaurantInput = z.infer<typeof restaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type RestaurantAdminProfileInput = z.infer<
  typeof restaurantAdminProfileSchema
>;

// --- CATEGORY SCHEMAS ---
export const categorySchema = z.object({
  restaurantId: z.string().min(1, "Restaurant ID is required"),
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(100, "Name too long"),
  slug: z.string().trim().optional(),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  sortOrder: z
    .number()
    .int()
    .min(0, "Sort order must be non-negative")
    .default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = categorySchema
  .partial()
  .omit({ restaurantId: true });
export type CreateCategoryInput = z.infer<typeof categorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// --- ADD-ON GROUP SCHEMAS ---
export const addonGroupSchema = z.object({
  restaurantId: z.string().min(1, "Restaurant ID is required"),
  name: z
    .string()
    .trim()
    .min(1, "Group name is required")
    .max(100, "Name too long"),
  isRequired: z.boolean().default(false),
  minSelect: z
    .number()
    .int()
    .min(0, "Min select must be 0 or higher")
    .default(0),
  maxSelect: z
    .number()
    .int()
    .min(1, "Max select must be at least 1")
    .default(1),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateAddonGroupSchema = addonGroupSchema
  .partial()
  .omit({ restaurantId: true });
export type CreateAddonGroupInput = z.infer<typeof addonGroupSchema>;
export type UpdateAddonGroupInput = z.infer<typeof updateAddonGroupSchema>;

// --- ADD-ON SCHEMAS ---
export const addonSchema = z.object({
  addonGroupId: z.string().min(1, "Add-on Group ID is required"),
  name: z
    .string()
    .trim()
    .min(1, "Add-on name is required")
    .max(100, "Name too long"),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  isActive: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateAddonSchema = addonSchema
  .partial()
  .omit({ addonGroupId: true });
export type CreateAddonInput = z.infer<typeof addonSchema>;
export type UpdateAddonInput = z.infer<typeof updateAddonSchema>;

// --- DISH SCHEMAS ---
export const dishSchema = z.object({
  restaurantId: z.string().min(1, "Restaurant ID is required"),
  categoryId: z.string().min(1, "Category ID is required"),
  name: z
    .string()
    .trim()
    .min(1, "Dish name is required")
    .max(150, "Name too long"),
  slug: z.string().trim().optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  preparationTime: z
    .number()
    .int()
    .min(0, "Preparation time must be non-negative")
    .optional(),
  type: z.enum(["VEG", "NON_VEG"]).default("VEG"),
  isAvailable: z.boolean().default(true),
  isCustomizable: z.boolean().default(false),
  image: z.string().trim().optional(),
  video: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  videoUrl: z.string().trim().optional(),
  videoPosterUrl: z.string().trim().optional(),
  sortOrder: z.number().int().min(0).default(0),
  addonGroupIds: z.array(z.string()).optional(),
});

export const updateDishSchema = dishSchema
  .partial()
  .omit({ restaurantId: true });
export type CreateDishInput = z.infer<typeof dishSchema>;
export type UpdateDishInput = z.infer<typeof updateDishSchema>;

export const createTableSchema = z.object({
  tableNumber: z.number().int().min(1).max(9999),
  label: z.string().trim().max(80).optional(),
  isActive: z.boolean().default(true),
  status: z.enum(["OPEN", "OCCUPIED", "CLOSED"]).default("OPEN"),
});
export const updateTableSchema = createTableSchema.partial();
export const placeOrderSchema = z.object({
  slug: z.string().min(1),
  tableNumber: z.number().int().min(1),
  idempotencyKey: z.string().uuid(),
  items: z.array(z.object({
    dishId: z.string().min(1),
    quantity: z.number().int().min(1).max(99),
    expectedUnitPrice: z.number().min(0),
    selections: z.array(z.object({
      groupId: z.string().min(1),
      addons: z.array(z.object({ addonId: z.string().min(1), expectedUnitPrice: z.number().min(0) })).max(20),
    })).max(30),
  })).min(1).max(50),
});
export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
