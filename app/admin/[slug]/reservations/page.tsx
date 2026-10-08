import { notFound, redirect } from "next/navigation";
import ReservationsManager from "@/components/admin/ReservationsManager";
import { getRestaurantAdminContext } from "@/lib/auth-server";
import { restaurantService } from "@/lib/services/restaurant.service";
import { requireRestaurantFeature } from "@/lib/feature-access";
import { reservationService } from "@/lib/services/reservation.service";
import { getReservationLocalDate } from "@/lib/reservations/time";

export const dynamic = "force-dynamic";

export default async function RestaurantReservationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const context = await getRestaurantAdminContext();
  if (context?.role !== "RESTAURANT_ADMIN" || !context.restaurantId || context.restaurantSlug !== slug) redirect("/admin/login");
  const restaurant = await restaurantService.getById(context.restaurantId);
  if (!restaurant || restaurant.isActive === false || restaurant.slug !== slug) redirect("/admin/login");
  const feature = requireRestaurantFeature(restaurant, "RESERVATIONS");
  if (!feature.allowed) notFound();
  const date = getReservationLocalDate();
  return <ReservationsManager initialDate={date} initialReservations={await reservationService.list(context.restaurantId, date)} />;
}
