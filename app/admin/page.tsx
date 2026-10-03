import { redirect } from "next/navigation";
import { getRestaurantAdminContext } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function AdminRootPage() {
  const ctx = await getRestaurantAdminContext();
  if (!ctx) {
    redirect("/admin/login");
  }

  if (!ctx.restaurantSlug && !ctx.restaurantId) {
    redirect("/admin/login");
  }

  redirect(`/admin/${ctx.restaurantSlug || ctx.restaurantId}`);
}
