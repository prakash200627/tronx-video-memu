import CategoriesManager from "@/components/admin/CategoriesManager";
import { categoryService } from "@/lib/services/category.service";

export const dynamic = "force-dynamic";

export default async function RestaurantCategoriesSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = await categoryService.getByRestaurantId(slug);

  return (
    <CategoriesManager initialCategories={categories} restaurantId={slug} />
  );
}
