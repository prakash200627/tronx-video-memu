import DishesManager from "@/components/admin/DishesManager";
import { addonService } from "@/lib/services/addon.service";
import { categoryService } from "@/lib/services/category.service";
import { dishService } from "@/lib/services/dish.service";
import { restaurantService } from "@/lib/services/restaurant.service";
import { hasRestaurantFeature } from "@/lib/features";

export const dynamic = "force-dynamic";

export default async function RestaurantDishesSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [restaurant, dishes, categories, addonGroups] = await Promise.all([
    restaurantService.getBySlug(slug),
    dishService.getByRestaurantId(slug),
    categoryService.getByRestaurantId(slug),
    addonService.getGroupsByRestaurantId(slug),
  ]);

  return (
    <DishesManager
      initialDishes={dishes}
      categories={categories}
      addonGroups={addonGroups}
      restaurantId={slug}
      videoMenuEnabled={restaurant ? hasRestaurantFeature(restaurant, "VIDEO_MENU") : false}
      mediaLibraryEnabled={restaurant ? hasRestaurantFeature(restaurant, "MEDIA_LIBRARY") : false}
    />
  );
}
