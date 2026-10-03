// User & Authentication Roles
export type UserRole = "SUPER_ADMIN" | "RESTAURANT_ADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  restaurantId?: string;
  createdAt: string;
  updatedAt: string;
};

export type RestaurantSocialLinks = {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  website?: string;
};

// Restaurant Profile
export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  coverImage?: string;
  description?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  openingHours?: string;
  currency?: string;
  socialLinks?: RestaurantSocialLinks;
  isOpen: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Compatibility fields for customer menu UI
  logoUrl?: string;
  coverUrl?: string;
  isActive?: boolean;
};

// Category
export type Category = {
  id: string;
  restaurantId?: string;
  name: string;
  slug?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// Dish Classification
export type DishType = "VEG" | "NON_VEG";

// Add-on
export type Addon = {
  id: string;
  addonGroupId?: string;
  name: string;
  price: number;
  isActive?: boolean;
  isAvailable?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

// Add-on Group
export type AddonGroup = {
  id: string;
  restaurantId?: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder?: number;
  isActive?: boolean;
  addons: Addon[];
  createdAt?: string;
  updatedAt?: string;
};

// Dish
export type Dish = {
  id: string;
  restaurantId?: string;
  categoryId: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  preparationTime?: number;
  type?: DishType;
  isVeg: boolean;
  isAvailable: boolean;
  isCustomizable?: boolean;
  image?: string;
  video?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoPosterUrl?: string;
  sortOrder: number;
  addonGroupIds?: string[];
  addonGroups?: AddonGroup[];
  createdAt?: string;
  updatedAt?: string;
};

// Media
export type MediaType = "IMAGE" | "VIDEO";
export type MediaResourceType = "image" | "video" | "raw";

export type Media = {
  id: string;
  restaurantId: string;
  type: MediaType;
  url: string;
  publicId: string;
  resourceType: MediaResourceType;
  format?: string;
  width?: number;
  height?: number;
  duration?: number;
  isExternal?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// Aggregated Menu
export type RestaurantMenu = {
  restaurant: Restaurant;
  categories: Category[];
  dishes: Dish[];
};

export type RestaurantTable = {
  id: string;
  restaurantId: string;
  tableNumber: number;
  label?: string;
  isActive: boolean;
  status: TableStatus;
  createdAt: string;
  updatedAt: string;
};

export type TableStatus = "OPEN" | "OCCUPIED" | "CLOSED";

export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "CANCELLED";

export type OrderAddonSnapshot = {
  addonId: string;
  nameSnapshot: string;
  quantity: number;
  unitPriceSnapshot: number;
  total: number;
};

export type OrderItemSnapshot = {
  dishId: string;
  dishNameSnapshot: string;
  quantity: number;
  unitPriceSnapshot: number;
  addons: OrderAddonSnapshot[];
  itemTotal: number;
};

export type RestaurantOrder = {
  id: string;
  restaurantId: string;
  tableId: string;
  tableNumber: number;
  orderNumber: number;
  customerTokenHash: string;
  idempotencyKey: string;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderSummary = Pick<RestaurantOrder,
  "id" | "orderNumber" | "tableNumber" | "status" | "items" | "subtotal" | "total" | "createdAt" | "updatedAt"
>;

// Standard API Response envelope
export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; details?: unknown };
