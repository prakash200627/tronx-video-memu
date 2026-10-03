import TablesManager from "@/components/admin/TablesManager";
import { tableService } from "@/lib/services/table.service";
import { orderService } from "@/lib/services/order.service";

export const dynamic = "force-dynamic";

export default async function RestaurantTablesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [initialTables, initialOrders] = await Promise.all([tableService.list(slug), orderService.listForRestaurant(slug)]);
  return <TablesManager initialTables={initialTables} initialOrders={initialOrders} restaurantSlug={slug} />;
}
