import RestaurantProfileForm from "@/components/admin/RestaurantProfileForm";
import { redirect } from "next/navigation";
import { getRestaurantAdminContext } from "@/lib/auth-server";
import { hasRestaurantFeature } from "@/lib/features";
import { restaurantService } from "@/lib/services/restaurant.service";

export const dynamic = "force-dynamic";

export default async function RestaurantProfileSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await getRestaurantAdminContext();
  if (!context || context.role !== "RESTAURANT_ADMIN" || !context.restaurantId || context.restaurantSlug !== slug) redirect("/admin/login");
  const restaurant = await restaurantService.getById(context.restaurantId);

  if (!restaurant) {
    return (
      <p className="text-sm text-white/60">Restaurant profile not found.</p>
    );
  }

  return <RestaurantProfileForm restaurant={restaurant} restaurantId={context.restaurantId} wifiEnabled={hasRestaurantFeature(restaurant, "WIFI")} />;
}
