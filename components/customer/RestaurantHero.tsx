import Image from "next/image";
import type { Restaurant } from "@/types";

type RestaurantHeroProps = {
  restaurant: Restaurant;
};

export default function RestaurantHero({ restaurant }: RestaurantHeroProps) {
  return (
    <header className="relative overflow-hidden bg-[#241416]">
      {/* Cover image or fallback */}
      <div className="relative h-64 w-full sm:h-80 lg:h-[22rem]">
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

        <div className="absolute inset-0 bg-linear-to-t from-[#241416]/90 via-[#241416]/50 to-[#241416]/25" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-5 text-center">
        <div className="mx-auto flex max-w-3xl flex-col items-center">
            {/* Logo */}
            <div className="relative mb-4 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-[#fff5ec] shadow-xl sm:h-20 sm:w-20">
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
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-[#e8b896] sm:text-xs">Restaurant menu</p>
              <h1 className="font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {restaurant.name}
              </h1>

              <p className="mt-2 text-sm font-medium text-white/80 sm:text-base">
                {restaurant.tagline?.trim() || "Digital Menu"}
              </p>
              <span
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  restaurant.isOpen
                    ? "bg-emerald-400/15 text-emerald-200"
                    : "bg-rose-400/15 text-rose-200"
                }`}
              >
                {restaurant.isOpen ? "Open now" : "Currently closed"}
              </span>
            </div>
        </div>
      </div>
    </header>
  );
}
