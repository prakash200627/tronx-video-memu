import Link from "next/link";
import { FolderTree, UtensilsCrossed, Sliders, ArrowRight } from "lucide-react";
import { restaurantService } from "@/lib/services/restaurant.service";

export const dynamic = "force-dynamic";

export default async function AdminRestaurantMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const menu = await restaurantService.getFullMenu(slug);
  const categories = menu?.categories || [];
  const dishes = menu?.dishes || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Menu Management
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Configure categories, catalog dishes, and set up customer
          customization groups.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Link
          href={`/admin/${slug}/menu/categories`}
          className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/25 hover:bg-white/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-white">
            <FolderTree className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-white">Categories</h2>
          <p className="mt-1 text-xs text-white/50 leading-relaxed">
            Manage menu sections ({categories.length} configured), visibility,
            and display sort order.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-white/70 group-hover:text-white">
            <span>Manage Categories</span>
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          href={`/admin/${slug}/menu/dishes`}
          className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/25 hover:bg-white/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-white">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-white">Dishes</h2>
          <p className="mt-1 text-xs text-white/50 leading-relaxed">
            Manage your food & drink items ({dishes.length} dishes), prices,
            descriptions, and video links.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-white/70 group-hover:text-white">
            <span>Manage Dishes</span>
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          href={`/admin/${slug}/menu/addons`}
          className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/25 hover:bg-white/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-white">
            <Sliders className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-white">
            Add-ons & Options
          </h2>
          <p className="mt-1 text-xs text-white/50 leading-relaxed">
            Configure extras, accompaniments, required options, and choice
            boundaries.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-white/70 group-hover:text-white">
            <span>Manage Add-ons</span>
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    </div>
  );
}
