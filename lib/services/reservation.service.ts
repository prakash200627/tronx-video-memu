import type { Reservation, ReservationStatus } from "@/types";
import { reservationRepository, ReservationRepositoryError } from "@/lib/repositories/reservation.repository";
import { tableService } from "@/lib/services/table.service";
import { getReservationWindow, RESERVATION_TIME_ZONE } from "@/lib/reservations/time";
import type { ReservationAvailabilityInput, CreateReservationInput } from "@/lib/validations";

const transitions: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CANCELLED", "COMPLETED", "NO_SHOW"],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
};

export class ReservationServiceError extends Error {
  constructor(message: string, readonly statusCode = 400) { super(message); }
}

function buildWindow(input: Pick<ReservationAvailabilityInput, "reservationDate" | "startTime">) {
  try { return getReservationWindow(input.reservationDate, input.startTime); }
  catch (error) { throw new ReservationServiceError(error instanceof Error ? error.message : "Invalid reservation time."); }
}

export class ReservationService {
  async availability(restaurantId: string, input: ReservationAvailabilityInput) {
    const window = buildWindow(input);
    const tables = await tableService.listBookable(restaurantId, input.guestCount);
    const conflicts = await reservationRepository.findAvailableOverlapping(restaurantId, tables.map((table) => table.id), window.startAt, window.endAt);
    const blockedIds = new Set(conflicts.map((reservation) => reservation.tableId));
    return {
      reservationDate: input.reservationDate,
      startTime: input.startTime,
      endTime: window.endTime,
      tables: tables.filter((table) => !blockedIds.has(table.id)).map(({ id, tableNumber, label, capacity }) => ({ id, tableNumber, label, capacity })),
    };
  }

  async create(restaurantId: string, input: CreateReservationInput): Promise<Reservation> {
    const window = buildWindow(input);
    try {
      return await reservationRepository.createForAvailableTable({
        restaurantId,
        tableId: input.tableId,
        tableNumberSnapshot: 0,
        customerName: input.customerName,
        customerPhone: input.customerPhone.replace(/\s+/g, " ").trim(),
        customerEmail: input.customerEmail?.trim().toLowerCase() || undefined,
        reservationDate: input.reservationDate,
        startTime: input.startTime,
        endTime: window.endTime,
        startAt: window.startAt,
        endAt: window.endAt,
        timezone: RESERVATION_TIME_ZONE,
        guestCount: input.guestCount,
        specialRequest: input.specialRequest?.trim() || undefined,
        status: "PENDING",
      });
    } catch (error) {
      if (error instanceof ReservationRepositoryError) throw new ReservationServiceError(error.message, error.statusCode);
      throw error;
    }
  }

  async list(restaurantId: string, reservationDate?: string) {
    return reservationRepository.findByRestaurant(restaurantId, reservationDate);
  }

  async get(restaurantId: string, id: string) {
    return reservationRepository.findByRestaurantAndId(restaurantId, id);
  }

  async updateStatus(restaurantId: string, id: string, status: ReservationStatus) {
    const current = await reservationRepository.findByRestaurantAndId(restaurantId, id);
    if (!current) return null;
    if (!transitions[current.status].includes(status)) {
      throw new ReservationServiceError(`Reservation cannot move from ${current.status} to ${status}.`, 409);
    }
    const updated = await reservationRepository.updateStatus(restaurantId, id, current.status, status);
    if (!updated) throw new ReservationServiceError("Reservation status changed. Refresh and try again.", 409);
    return updated;
  }
}

export const reservationService = new ReservationService();
