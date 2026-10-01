import { notFound, redirect } from "next/navigation";
import RestaurantEditor from "@/components/super-admin/RestaurantEditor";
import { getAdminContext } from "@/lib/auth-server";
import { restaurantService } from "@/lib/services/restaurant.service";

export const dynamic = "force-dynamic";

export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const context = await getAdminContext();
  if (!context || context.role !== "SUPER_ADMIN")
    redirect("/super-admin/login");

  const { restaurantId } = await params;
  const restaurant = await restaurantService.getById(restaurantId);
  if (!restaurant) notFound();
  return <RestaurantEditor restaurant={restaurant} />;
}
