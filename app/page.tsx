import Link from "next/link";
import { restaurantService } from "@/lib/services/restaurant.service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const restaurants = (await restaurantService.getAll()).filter(
    (restaurant) => restaurant.isActive !== false,
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4">
      {/* Branding */}
      <h1 className="text-4xl font-bold text-white mb-4">
        Welcome to <span className="text-emerald-400">TRONX</span> Restaurants
      </h1>
      <p className="text-lg text-gray-300 mb-8 max-w-2xl text-center">
        TRONX powers digital, video‑rich menus for restaurants worldwide. Browse
        our partner restaurants below or manage your own.
      </p>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-12">
        <Link
          href="/super-admin/login"
          className="rounded bg-emerald-600 px-5 py-2 text-white hover:bg-emerald-500 transition"
        >
          Super Admin
        </Link>
        <Link
          href="/admin/login"
          className="rounded bg-gray-700 px-5 py-2 text-white hover:bg-gray-600 transition"
        >
          Restaurant Admin
        </Link>
      </div>

      {/* Restaurant Discovery */}
      <section className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-white mb-4 text-center">
          Explore Restaurants
        </h2>
        {restaurants && restaurants.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restaurants.map((r) => (
              <li key={r.id} className="">
                <Link
                  href={`/menu/${r.slug}`}
                  className="flex items-center justify-between rounded bg-gray-800 p-4 text-white hover:bg-gray-700 transition"
                >
                  {r.name}
                  <span className="text-sm text-emerald-400">View Menu</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-400">
            No restaurants available yet.
          </p>
        )}
      </section>
    </main>
  );
}
