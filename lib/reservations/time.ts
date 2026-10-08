export const RESERVATION_TIME_ZONE = "Asia/Kolkata" as const;
export const RESERVATION_DURATION_MINUTES = 60;
const KOLKATA_OFFSET_MINUTES = 330;

export function getReservationLocalDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: RESERVATION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getReservationWindow(reservationDate: string, startTime: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(reservationDate);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(startTime);
  if (!dateMatch || !timeMatch) throw new Error("Enter a valid reservation date and time.");
  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const calendarCheck = new Date(Date.UTC(year, month - 1, day));
  if (calendarCheck.getUTCFullYear() !== year || calendarCheck.getUTCMonth() !== month - 1 || calendarCheck.getUTCDate() !== day || hour > 23 || minute > 59) {
    throw new Error("Enter a valid reservation date and time.");
  }

  const nowLocal = getReservationLocalDate();
  if (reservationDate < nowLocal) throw new Error("Reservation date must be today or later.");
  const startAt = new Date(Date.UTC(year, month - 1, day, hour, minute) - KOLKATA_OFFSET_MINUTES * 60_000);
  if (startAt.getTime() <= Date.now()) throw new Error("Reservation time must be in the future.");
  const endAt = new Date(startAt.getTime() + RESERVATION_DURATION_MINUTES * 60_000);
  const endLocal = new Date(endAt.getTime() + KOLKATA_OFFSET_MINUTES * 60_000);
  const endTime = `${String(endLocal.getUTCHours()).padStart(2, "0")}:${String(endLocal.getUTCMinutes()).padStart(2, "0")}`;
  return { startAt, endAt, endTime };
}
