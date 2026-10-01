import { redirect } from "next/navigation";
import RestaurantEditor from "@/components/super-admin/RestaurantEditor";
import { getAdminContext } from "@/lib/auth-server";

export default async function NewRestaurantPage() {
  const context = await getAdminContext();
  if (!context || context.role !== "SUPER_ADMIN")
    redirect("/super-admin/login");
  return <RestaurantEditor />;
}
