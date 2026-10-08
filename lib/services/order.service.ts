import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { orderRepository } from "@/lib/repositories/order.repository";
import { restaurantService } from "@/lib/services/restaurant.service";
import { tableRepository } from "@/lib/repositories/table.repository";
import type { OrderStatus, RestaurantOrder } from "@/types";
import type { PlaceOrderInput } from "@/lib/validations";

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY"],
  READY: ["SERVED"],
  SERVED: [],
  CANCELLED: [],
};

export class OrderServiceError extends Error {
  constructor(message: string, readonly statusCode = 409) { super(message); }
}

const customerView = (order: RestaurantOrder) => ({
  id: order.id,
  orderNumber: order.orderNumber,
  tableNumber: order.tableNumber,
  status: order.status,
  items: order.items,
  subtotal: order.subtotal,
  total: order.total,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

export class OrderService {
  async listForRestaurant(restaurantId: string) {
    return (await orderRepository.findByRestaurantId(restaurantId)).map(customerView);
  }

  async getForRestaurant(restaurantId: string, id: string) {
    const order = await orderRepository.findByRestaurantAndId(restaurantId, id);
    return order ? customerView(order) : null;
  }

  async createPublic(input: PlaceOrderInput) {
    const menu = await restaurantService.getFullMenu(input.slug);
    if (!menu) throw new OrderServiceError("Restaurant not found.", 404);
    const table = await tableRepository.findByRestaurantAndNumber(menu.restaurant.id, input.tableNumber);
    if (!table || !table.isActive || table.status === "CLOSED") throw new OrderServiceError("This table is unavailable. Please ask restaurant staff for help.");
    if (await orderRepository.hasIdempotencyKey(menu.restaurant.id, input.idempotencyKey)) {
      throw new OrderServiceError("This order was already submitted. Refresh the page to see your order status.");
    }

    const items = input.items.map((requested) => {
      const dish = menu.dishes.find((entry) => entry.id === requested.dishId);
      if (!dish || dish.restaurantId !== menu.restaurant.id) throw new OrderServiceError("A selected dish is no longer available on this menu.");
      if (!dish.isAvailable) throw new OrderServiceError(`${dish.name} is currently unavailable.`);

      const selections = new Map<string, (typeof requested.selections)[number]>();
      for (const selection of requested.selections) {
        if (selections.has(selection.groupId)) throw new OrderServiceError("Invalid duplicate customization group.");
        selections.set(selection.groupId, selection);
      }
      const dishGroups = dish.addonGroups ?? [];
      for (const groupId of selections.keys()) {
        if (!dishGroups.some((group) => group.id === groupId && group.isActive !== false)) {
          throw new OrderServiceError(`A customization for ${dish.name} is invalid.`);
        }
      }

      const addons = dishGroups.flatMap((group) => {
        if (group.isActive === false) return [];
        const selected = selections.get(group.id);
        const ids = selected?.addons.map((addon) => addon.addonId) ?? [];
        if (new Set(ids).size !== ids.length) throw new OrderServiceError(`Duplicate option selected for ${group.name}.`);
        if (ids.length < (group.isRequired ? Math.max(1, group.minSelect) : group.minSelect) || ids.length > group.maxSelect) {
          throw new OrderServiceError(`Choose the required options for ${group.name}.`);
        }
        return ids.map((id) => {
          const addon = group.addons.find((entry) => entry.id === id);
          if (!addon || addon.isActive === false || addon.isAvailable === false) throw new OrderServiceError(`An option for ${dish.name} is no longer available.`);
          const expectedPrice = selected?.addons.find((selection) => selection.addonId === id)?.expectedUnitPrice;
          if (expectedPrice !== addon.price) throw new OrderServiceError(`The price for ${dish.name} customization changed. Please review your cart.`);
          return { addonId: addon.id, nameSnapshot: addon.name, quantity: 1, unitPriceSnapshot: addon.price, total: addon.price };
        });
      });

      const unitPriceSnapshot = dish.price;
      if (requested.expectedUnitPrice !== unitPriceSnapshot) throw new OrderServiceError(`The price for ${dish.name} changed. Please review your cart.`);
      const itemTotal = (unitPriceSnapshot + addons.reduce((sum, addon) => sum + addon.total, 0)) * requested.quantity;
      return { dishId: dish.id, dishNameSnapshot: dish.name, quantity: requested.quantity, unitPriceSnapshot, addons, itemTotal };
    });

    const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
    const currentTable = await tableRepository.findByRestaurantAndId(menu.restaurant.id, table.id);
    if (!currentTable?.isActive || currentTable.status === "CLOSED") throw new OrderServiceError("This table became unavailable. Please ask restaurant staff for help.");
    const customerToken = randomBytes(32).toString("base64url");
    const created = await orderRepository.create({
      id: `order-${randomUUID()}`,
      restaurantId: menu.restaurant.id,
      tableId: table.id,
      tableNumber: table.tableNumber,
      customerTokenHash: createHash("sha256").update(customerToken).digest("hex"),
      idempotencyKey: input.idempotencyKey,
      status: "PENDING",
      items,
      subtotal,
      total: subtotal,
    });
    return { order: customerView(created), customerToken };
  }

  async updateStatus(restaurantId: string, id: string, status: OrderStatus) {
    const current = await orderRepository.findByRestaurantAndId(restaurantId, id);
    if (!current) return null;
    if (!allowedTransitions[current.status].includes(status)) {
      throw new OrderServiceError(`Order cannot move from ${current.status} to ${status}.`);
    }
    let table = null;
    if (status === "ACCEPTED") {
      table = await tableRepository.findByRestaurantAndId(restaurantId, current.tableId);
      if (!table || !table.isActive || table.status === "CLOSED") {
        throw new OrderServiceError("This table is closed or unavailable. The order cannot be accepted.");
      }
    }
    const updated = await orderRepository.updateStatus(restaurantId, id, current.status, status);
    if (!updated) throw new OrderServiceError("Order status changed. Refresh and try again.");
    if (status === "ACCEPTED" && table) {
      const occupied = await tableRepository.markOccupiedForAcceptedOrder(restaurantId, table.id);
      if (!occupied) {
        await orderRepository.revertAcceptance(restaurantId, id);
        throw new OrderServiceError("This table was closed or unavailable before the order could be accepted.");
      }
    }
    return customerView(updated);
  }

  async getCustomerStatus(id: string, token: string) {
    const order = await orderRepository.findForCustomer(id);
    if (!order || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
    const expected = Buffer.from(order.customerTokenHash, "hex");
    const supplied = Buffer.from(createHash("sha256").update(token).digest("hex"), "hex");
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    return customerView(order);
  }
}

export const orderService = new OrderService();
