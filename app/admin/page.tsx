import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function AdminRootPage() {
  const ctx = await getAdminContext();
  if (!ctx) {
    redirect("/admin/login");
  }

  if (ctx.role === "SUPER_ADMIN") {
    redirect("/super-admin");
  }

  if (!ctx.restaurantSlug && !ctx.restaurantId) {
    redirect("/admin/login");
  }

  redirect(`/admin/${ctx.restaurantSlug || ctx.restaurantId}`);
}
