import type { Category } from "@/types";
import type { ICategoryRepository } from "./types";
import { connectToDatabase } from "@/lib/db/mongodb";
import { CategoryModel, DishModel } from "@/lib/db/models";
import { toDomain } from "@/lib/db/mongo-mappers";

export class CategoryRepository implements ICategoryRepository {
  async findByRestaurantId(restaurantId: string): Promise<Category[]> {
    await connectToDatabase();
    const categories = await CategoryModel.find({ restaurantId })
      .sort({ sortOrder: 1 })
      .lean();
    return categories.map((category) => toDomain<Category>(category));
  }

  async findById(id: string): Promise<Category | null> {
    await connectToDatabase();
    const category = await CategoryModel.findOne({ id }).lean();
    return category ? toDomain<Category>(category) : null;
  }

  async create(
    data: Omit<Category, "id" | "createdAt" | "updatedAt">,
  ): Promise<Category> {
    await connectToDatabase();
    const now = new Date().toISOString();
    const id = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newCategory = {
      ...data,
      id,
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, "-"),
      createdAt: now,
      updatedAt: now,
    };
    const created = await CategoryModel.create(newCategory);
    return toDomain<Category>(created.toObject());
  }

  async update(id: string, data: Partial<Category>): Promise<Category | null> {
    await connectToDatabase();
    const updated = await CategoryModel.findOneAndUpdate(
      { id },
      { $set: { ...data, id, updatedAt: new Date().toISOString() } },
      { new: true, runValidators: true },
    ).lean();
    return updated ? toDomain<Category>(updated) : null;
  }

  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const dishCount = await DishModel.countDocuments({ categoryId: id });
    if (dishCount > 0) {
      throw new Error("Cannot delete a category while dishes reference it");
    }
    const result = await CategoryModel.deleteOne({ id });
    return result.deletedCount === 1;
  }
}

export const categoryRepository = new CategoryRepository();
