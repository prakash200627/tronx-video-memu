import { randomUUID } from "node:crypto";
import type { Reservation, ReservationStatus } from "@/types";
import { ReservationModel, TableModel } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/mongodb";
import { toDomain } from "@/lib/db/mongo-mappers";
import type { IReservationRepository } from "@/lib/repositories/types";

const toReservation = (value: unknown) => toDomain<Reservation>(value);

export class ReservationRepositoryError extends Error {
  constructor(message: string, readonly statusCode: number) { super(message); }
}

export class ReservationRepository implements IReservationRepository {
  async findAvailableOverlapping(restaurantId: string, tableIds: string[], startAt: Date, endAt: Date) {
    if (!tableIds.length) return [];
    await connectToDatabase();
    const reservations = await ReservationModel.find({
      restaurantId,
      tableId: { $in: tableIds },
      status: { $in: ["PENDING", "CONFIRMED"] },
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    }).lean();
    return reservations.map(toReservation);
  }

  async findByRestaurant(restaurantId: string, reservationDate?: string) {
    await connectToDatabase();
    const filter: { restaurantId: string; reservationDate?: string } = { restaurantId };
    if (reservationDate) filter.reservationDate = reservationDate;
    const reservations = await ReservationModel.find(filter).sort({ startAt: 1, createdAt: -1 }).lean();
    return reservations.map(toReservation);
  }

  async findByRestaurantAndId(restaurantId: string, id: string) {
    await connectToDatabase();
    const reservation = await ReservationModel.findOne({ restaurantId, id }).lean();
    return reservation ? toReservation(reservation) : null;
  }

  async createForAvailableTable(input: Omit<Reservation, "id" | "createdAt" | "updatedAt">) {
    const connection = await connectToDatabase();
    const session = await connection.startSession();
    let created: Reservation | null = null;
    try {
      await session.withTransaction(async () => {
        const table = await TableModel.findOneAndUpdate(
          {
            restaurantId: input.restaurantId,
            id: input.tableId,
            isActive: true,
            status: "OPEN",
            capacity: { $gte: input.guestCount },
          },
          { $inc: { reservationRevision: 1 } },
          { new: true, session },
        ).lean();
        if (!table) throw new ReservationRepositoryError("This table is no longer available for that party size.", 409);

        const overlapping = await ReservationModel.findOne({
          restaurantId: input.restaurantId,
          tableId: input.tableId,
          status: { $in: ["PENDING", "CONFIRMED"] },
          startAt: { $lt: input.endAt },
          endAt: { $gt: input.startAt },
        }).session(session).lean();
        if (overlapping) throw new ReservationRepositoryError("This table was just reserved for that time. Please choose another table or time.", 409);

        const now = new Date().toISOString();
        const [record] = await ReservationModel.create([{
          ...input,
          id: `reservation-${randomUUID()}`,
          tableNumberSnapshot: table.tableNumber,
          createdAt: now,
          updatedAt: now,
        }], { session });
        created = toReservation(record.toObject());
      });
      if (!created) throw new ReservationRepositoryError("Unable to complete the reservation.", 500);
      return created;
    } catch (error) {
      if (error instanceof ReservationRepositoryError) throw error;
      if (error && typeof error === "object" && "code" in error && (error.code === 20 || error.code === 303)) {
        throw new ReservationRepositoryError("Reservations require MongoDB transaction support, which is unavailable.", 503);
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateStatus(restaurantId: string, id: string, currentStatus: ReservationStatus, status: ReservationStatus) {
    await connectToDatabase();
    const reservation = await ReservationModel.findOneAndUpdate(
      { restaurantId, id, status: currentStatus },
      { $set: { status, updatedAt: new Date().toISOString() } },
      { new: true, runValidators: true },
    ).lean();
    return reservation ? toReservation(reservation) : null;
  }
}

export const reservationRepository = new ReservationRepository();
