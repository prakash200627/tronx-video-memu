import AddonsManager from "@/components/admin/AddonsManager";
import { addonService } from "@/lib/services/addon.service";

export const dynamic = "force-dynamic";

export default async function RestaurantAddonsSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const groups = await addonService.getGroupsByRestaurantId(slug);

  return <AddonsManager initialGroups={groups} restaurantId={slug} />;
}
