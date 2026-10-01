import mongoose, { Schema } from "mongoose";
import type {
  Addon,
  AddonGroup,
  Category,
  Dish,
  Media,
  Restaurant,
} from "@/types";

const baseOptions = {
  strict: true,
  versionKey: false as const,
};

const restaurantSchema = new Schema<Restaurant>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    logo: String,
    coverImage: String,
    description: String,
    tagline: String,
    phone: String,
    email: String,
    address: String,
    openingHours: String,
    currency: String,
    socialLinks: {
      instagram: String,
      facebook: String,
      twitter: String,
      website: String,
    },
    isOpen: { type: Boolean, required: true, default: true },
    isActive: { type: Boolean, default: true },
    logoUrl: String,
    coverUrl: String,
    createdAt: String,
    updatedAt: String,
  },
  { ...baseOptions, collection: "restaurants" },
);

const categorySchema = new Schema<Category>(
  {
    id: { type: String, required: true, unique: true, index: true },
    restaurantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: String,
    description: String,
    sortOrder: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
    createdAt: String,
    updatedAt: String,
  },
  { ...baseOptions, collection: "categories" },
);

const dishSchema = new Schema<Dish>(
  {
    id: { type: String, required: true, unique: true, index: true },
    restaurantId: { type: String, required: true, index: true },
    categoryId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: String,
    description: String,
    price: { type: Number, required: true },
    preparationTime: { type: Number, min: 0 },
    type: { type: String, enum: ["VEG", "NON_VEG"] },
    isVeg: { type: Boolean, required: true },
    isAvailable: { type: Boolean, required: true, default: true },
    isCustomizable: { type: Boolean, default: false },
    image: String,
    video: String,
    imageUrl: String,
    videoUrl: String,
    videoPosterUrl: String,
    sortOrder: { type: Number, required: true, default: 0 },
    addonGroupIds: { type: [String], default: [] },
    createdAt: String,
    updatedAt: String,
  },
  { ...baseOptions, collection: "dishes" },
);

const addonGroupSchema = new Schema<AddonGroup>(
  {
    id: { type: String, required: true, unique: true, index: true },
    restaurantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    isRequired: { type: Boolean, required: true, default: false },
    minSelect: { type: Number, required: true, default: 0 },
    maxSelect: { type: Number, required: true, default: 1 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: String,
    updatedAt: String,
  },
  { ...baseOptions, collection: "addonGroups" },
);

const addonSchema = new Schema<Addon>(
  {
    id: { type: String, required: true, unique: true, index: true },
    addonGroupId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    createdAt: String,
    updatedAt: String,
  },
  { ...baseOptions, collection: "addons" },
);

const mediaSchema = new Schema<Media>(
  {
    id: { type: String, required: true, unique: true, index: true },
    restaurantId: { type: String, required: true, index: true },
    type: { type: String, enum: ["IMAGE", "VIDEO"], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      required: true,
    },
    format: String,
    width: Number,
    height: Number,
    duration: Number,
    isExternal: { type: Boolean, default: false },
    createdAt: String,
    updatedAt: String,
  },
  { ...baseOptions, collection: "media" },
);

export const RestaurantModel =
  mongoose.models.Restaurant ??
  mongoose.model<Restaurant>("Restaurant", restaurantSchema);
export const CategoryModel =
  mongoose.models.Category ??
  mongoose.model<Category>("Category", categorySchema);
export const DishModel =
  mongoose.models.Dish ?? mongoose.model<Dish>("Dish", dishSchema);
export const AddonGroupModel =
  mongoose.models.AddonGroup ??
  mongoose.model<AddonGroup>("AddonGroup", addonGroupSchema);
export const AddonModel =
  mongoose.models.Addon ?? mongoose.model<Addon>("Addon", addonSchema);
export const MediaModel =
  mongoose.models.Media ?? mongoose.model<Media>("Media", mediaSchema);
