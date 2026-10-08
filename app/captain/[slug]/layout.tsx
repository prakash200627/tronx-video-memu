import { redirect } from "next/navigation";
import CaptainNavigation from "@/components/captain/CaptainNavigation";
import { requireCaptain } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function CaptainLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { restaurant, error } = await requireCaptain();
  if (error || !restaurant) redirect("/captain/login");
  if (restaurant.slug !== slug) redirect(`/captain/${restaurant.slug}`);
  return <div className="min-h-screen bg-black text-white lg:flex"><CaptainNavigation slug={restaurant.slug} /><main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-6xl">{children}</div></main></div>;
}
