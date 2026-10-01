import Link from "next/link";
import { notFound } from "next/navigation";
import { restaurantService } from "@/lib/services/restaurant.service";

export const dynamic = "force-dynamic";

export default async function AdminRestaurantDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await restaurantService.getById(slug);

  if (!restaurant) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/2 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
          {restaurant.slug}
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">
          {restaurant.name}
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Manage this restaurant’s menu, profile, media, and availability from
          one place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href={`/admin/${slug}/profile`}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/90 hover:bg-white/10"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">
            Profile
          </p>
          <p className="mt-2 text-lg font-semibold">
            Update restaurant details
          </p>
        </Link>
        <Link
          href={`/admin/${slug}/menu`}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/90 hover:bg-white/10"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">
            Menu
          </p>
          <p className="mt-2 text-lg font-semibold">Edit categories & dishes</p>
        </Link>
        <Link
          href={`/admin/${slug}/availability`}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/90 hover:bg-white/10"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">
            Availability
          </p>
          <p className="mt-2 text-lg font-semibold">
            Manage open hours & items
          </p>
        </Link>
      </div>
    </div>
  );
}
