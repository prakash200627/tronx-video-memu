import { randomUUID } from "node:crypto";
import type { RestaurantTable } from "@/types";
import type { ITableRepository } from "./types";
import { connectToDatabase } from "@/lib/db/mongodb";
import { OrderModel, TableModel } from "@/lib/db/models";
import { toDomain } from "@/lib/db/mongo-mappers";

function tableToDomain(table: unknown) {
  const result = toDomain<RestaurantTable>(table);
  return { ...result, status: result.status ?? "OPEN" };
}

export class TableRepository implements ITableRepository {
  async findByRestaurantId(restaurantId: string) {
    await connectToDatabase();
    const tables = await TableModel.find({ restaurantId }).sort({ tableNumber: 1 }).lean();
    return tables.map(tableToDomain);
  }

  async findByRestaurantAndNumber(restaurantId: string, tableNumber: number) {
    await connectToDatabase();
    const table = await TableModel.findOne({ restaurantId, tableNumber }).lean();
    return table ? tableToDomain(table) : null;
  }

  async findByRestaurantAndId(restaurantId: string, id: string) {
    await connectToDatabase();
    const table = await TableModel.findOne({ restaurantId, id }).lean();
    return table ? tableToDomain(table) : null;
  }

  async create(data: Omit<RestaurantTable, "id" | "createdAt" | "updatedAt">) {
    await connectToDatabase();
    const now = new Date().toISOString();
    const created = await TableModel.create({ ...data, id: `table-${randomUUID()}`, createdAt: now, updatedAt: now });
    return tableToDomain(created.toObject());
  }

  async update(restaurantId: string, id: string, data: Partial<RestaurantTable>) {
    await connectToDatabase();
    const { restaurantId: _ignored, id: _ignoredId, createdAt: _createdAt, updatedAt: _updatedAt, ...patch } = data;
    const table = await TableModel.findOneAndUpdate(
      { restaurantId, id },
      { $set: { ...patch, updatedAt: new Date().toISOString() } },
      { new: true, runValidators: true },
    ).lean();
    return table ? tableToDomain(table) : null;
  }

  async markOccupiedForAcceptedOrder(restaurantId: string, id: string) {
    await connectToDatabase();
    const result = await TableModel.updateOne(
      { restaurantId, id, isActive: true, status: { $in: ["OPEN", "OCCUPIED"] } },
      { $set: { status: "OCCUPIED", updatedAt: new Date().toISOString() } },
    );
    return result.matchedCount === 1;
  }

  async deleteIfUnused(restaurantId: string, id: string) {
    await connectToDatabase();
    const orderExists = await OrderModel.exists({ restaurantId, tableId: id });
    if (orderExists) return false;
    const result = await TableModel.deleteOne({ restaurantId, id });
    return result.deletedCount === 1;
  }
}

export const tableRepository = new TableRepository();
