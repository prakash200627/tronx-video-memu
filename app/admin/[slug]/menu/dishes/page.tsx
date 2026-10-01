import DishesManager from "@/components/admin/DishesManager";
import { addonService } from "@/lib/services/addon.service";
import { categoryService } from "@/lib/services/category.service";
import { dishService } from "@/lib/services/dish.service";

export const dynamic = "force-dynamic";

export default async function RestaurantDishesSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [dishes, categories, addonGroups] = await Promise.all([
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
    />
  );
}
