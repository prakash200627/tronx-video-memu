import Image from "next/image";
import type { Restaurant } from "@/types";

type RestaurantHeroProps = {
  restaurant: Restaurant;
};

export default function RestaurantHero({ restaurant }: RestaurantHeroProps) {
  return (
    <header className="relative overflow-hidden">
      {/* Cover image or fallback */}
      <div className="relative h-44 w-full sm:h-60">
        {restaurant.coverUrl ? (
          <Image
            src={restaurant.coverUrl}
            alt={restaurant.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-zinc-800 via-zinc-900 to-black" />
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* Restaurant information */}
      <div className="relative -mt-12 px-4 pb-5 sm:-mt-14 sm:px-8 sm:pb-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end gap-3.5 sm:gap-5">
            {/* Logo */}
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-zinc-900 shadow-xl sm:h-20 sm:w-20">
              {restaurant.logoUrl ? (
                <Image
                  src={restaurant.logoUrl}
                  alt={`${restaurant.name} logo`}
                  fill
                  sizes="(max-width: 640px) 64px, 80px"
                  className="object-cover"
                />
              ) : (
                <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {restaurant.name.charAt(0) || "T"}
                </span>
              )}
            </div>

            {/* Name & Tagline */}
            <div className="pb-0.5">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-3xl">
                {restaurant.name}
              </h1>

              <p className="mt-0.5 text-xs font-medium text-white/50 sm:text-sm">
                {restaurant.tagline?.trim() || "Digital Menu"}
              </p>
              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  restaurant.isOpen
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-rose-500/15 text-rose-300"
                }`}
              >
                {restaurant.isOpen ? "Open now" : "Currently closed"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
