import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth-server";
import { restaurantService } from "@/lib/services/restaurant.service";

export default async function RestaurantAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await getAdminContext();
  if (!context || context.role !== "RESTAURANT_ADMIN") {
    redirect("/admin/login");
  }

  const restaurant = await restaurantService.getBySlug(slug);
  if (
    !restaurant ||
    restaurant.isActive === false ||
    restaurant.id !== context.restaurantId ||
    restaurant.slug !== context.restaurantSlug
  ) {
    redirect("/api/auth/logout");
  }

  return children;
}
