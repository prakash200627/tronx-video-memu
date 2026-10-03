import OrdersManager from "@/components/admin/OrdersManager";
import { orderService } from "@/lib/services/order.service";

export const dynamic = "force-dynamic";

export default async function RestaurantOrdersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const initialOrders = await orderService.listForRestaurant(slug);
  return <OrdersManager initialOrders={initialOrders} />;
}
