import { notFound } from "next/navigation";
import CustomerMenu from "@/components/customer/CustomerMenu";
import { restaurantService } from "@/lib/services/restaurant.service";

export const dynamic = "force-dynamic";

export default async function RestaurantMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const menu = await restaurantService.getFullMenu(slug);

  if (!menu) notFound();

  return <CustomerMenu initialMenu={menu} restaurantIdOrSlug={slug} />;
}
