import RestaurantProfileForm from "@/components/admin/RestaurantProfileForm";
import { restaurantService } from "@/lib/services/restaurant.service";

export const dynamic = "force-dynamic";

export default async function RestaurantProfileSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await restaurantService.getById(slug);

  if (!restaurant) {
    return (
      <p className="text-sm text-white/60">Restaurant profile not found.</p>
    );
  }

  return <RestaurantProfileForm restaurant={restaurant} restaurantId={slug} />;
}
