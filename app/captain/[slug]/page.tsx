import { redirect } from "next/navigation";
import Link from "next/link";
import { requireCaptain } from "@/lib/auth-server";
import { orderService } from "@/lib/services/order.service";
import { tableService } from "@/lib/services/table.service";

export const dynamic = "force-dynamic";

export default async function CaptainDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const orderAuth = await requireCaptain("ORDER_MANAGEMENT");
  const tableAuth = await requireCaptain("TABLE_MANAGEMENT");
  if (orderAuth.error || tableAuth.error || !orderAuth.restaurant || !orderAuth.captain) redirect("/captain/login");
  if (orderAuth.restaurant.slug !== slug || tableAuth.restaurant?.id !== orderAuth.restaurant.id) redirect(`/captain/${orderAuth.restaurant.slug}`);
  const [orders, tables] = await Promise.all([orderService.listForRestaurant(orderAuth.captain.restaurantId), tableService.list(orderAuth.captain.restaurantId)]);
  const activeOrders = orders.filter((order) => !["SERVED", "CANCELLED"].includes(order.status)).length;
  return <div className="space-y-6"><header><p className="text-sm text-white/50">{orderAuth.restaurant.name}</p><h1 className="mt-1 text-3xl font-bold">Captain dashboard</h1><p className="mt-2 text-sm text-white/55">Hello, {orderAuth.captain.name}. Here is the current service overview.</p></header>
    <section className="grid gap-4 sm:grid-cols-3">{[{ label: "Active orders", value: activeOrders }, { label: "Total orders", value: orders.length }, { label: "Tables", value: tables.length }].map((item) => <article key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm text-white/50">{item.label}</p><p className="mt-2 text-3xl font-bold">{item.value}</p></article>)}</section>
    <div className="flex flex-wrap gap-3"><Link href={`/captain/${slug}/orders`} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black">View orders</Link><Link href={`/captain/${slug}/tables`} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white">View tables</Link></div>
  </div>;
}
