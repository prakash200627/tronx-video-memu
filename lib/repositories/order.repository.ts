import type { RestaurantOrder } from "@/types";
import type { IOrderRepository } from "./types";
import { connectToDatabase } from "@/lib/db/mongodb";
import { OrderCounterModel, OrderModel } from "@/lib/db/models";
import { toDomain } from "@/lib/db/mongo-mappers";

export class OrderRepository implements IOrderRepository {
  async create(data: Omit<RestaurantOrder, "orderNumber" | "createdAt" | "updatedAt">) {
    await connectToDatabase();
    const now = new Date().toISOString();
    try {
      await OrderCounterModel.updateOne(
        { restaurantId: data.restaurantId },
        { $setOnInsert: { restaurantId: data.restaurantId, value: 1000 } },
        { upsert: true },
      );
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) throw error;
    }
    const counter = await OrderCounterModel.findOneAndUpdate(
      { restaurantId: data.restaurantId },
      { $inc: { value: 1 } },
      { new: true },
    ).lean();
    const created = await OrderModel.create({
      ...data,
      orderNumber: Number(counter?.value ?? 1001),
      createdAt: now,
      updatedAt: now,
    });
    return toDomain<RestaurantOrder>(created.toObject());
  }

  async findByRestaurantId(restaurantId: string) {
    await connectToDatabase();
    const orders = await OrderModel.find({ restaurantId }).sort({ createdAt: -1 }).lean();
    return orders.map((order) => toDomain<RestaurantOrder>(order));
  }

  async findByRestaurantAndId(restaurantId: string, id: string) {
    await connectToDatabase();
    const order = await OrderModel.findOne({ restaurantId, id }).lean();
    return order ? toDomain<RestaurantOrder>(order) : null;
  }

  async findForCustomer(id: string) {
    await connectToDatabase();
    const order = await OrderModel.findOne({ id }).select("+customerTokenHash").lean();
    return order ? toDomain<RestaurantOrder>(order) : null;
  }

  async updateStatus(restaurantId: string, id: string, expectedStatus: RestaurantOrder["status"], status: RestaurantOrder["status"]) {
    await connectToDatabase();
    const order = await OrderModel.findOneAndUpdate(
      { restaurantId, id, status: expectedStatus },
      { $set: { status, updatedAt: new Date().toISOString() } },
      { new: true, runValidators: true },
    ).lean();
    return order ? toDomain<RestaurantOrder>(order) : null;
  }

  async revertAcceptance(restaurantId: string, id: string) {
    await connectToDatabase();
    const order = await OrderModel.findOneAndUpdate(
      { restaurantId, id, status: "ACCEPTED" },
      { $set: { status: "PENDING", updatedAt: new Date().toISOString() } },
      { new: true, runValidators: true },
    ).lean();
    return order ? toDomain<RestaurantOrder>(order) : null;
  }

  async hasIdempotencyKey(restaurantId: string, key: string) {
    await connectToDatabase();
    return Boolean(await OrderModel.exists({ restaurantId, idempotencyKey: key }));
  }
}

export const orderRepository = new OrderRepository();
