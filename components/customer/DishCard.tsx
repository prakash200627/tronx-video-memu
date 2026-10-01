import Image from "next/image";
import { Play, Utensils } from "lucide-react";
import type { Dish } from "@/types";
import VideoPlayer from "./VideoPlayer";

type DishCardProps = {
  dish: Dish;
  onClick: (dish: Dish) => void;
  priority?: boolean;
};

export default function DishCard({
  dish,
  onClick,
  priority = false,
}: DishCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(dish)}
      aria-label={`View details for ${dish.name}, ₹${dish.price}`}
      className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left transition duration-300 hover:border-white/20 hover:bg-white/[0.06] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      {/* Media area */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900">
        {dish.imageUrl ? (
          <Image
            src={dish.imageUrl}
            alt={dish.name}
            fill
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-850 via-zinc-900 to-zinc-950">
            <Utensils className="h-8 w-8 text-white/15" />
          </div>
        )}

        {dish.videoUrl && (
          <VideoPlayer
            videoUrl={dish.videoUrl}
            posterUrl={dish.videoPosterUrl || dish.imageUrl}
            title={dish.name}
            autoPlay
            muted
            loop
            controls={false}
            className="absolute inset-0 !aspect-auto rounded-none bg-transparent"
          />
        )}

        {/* Dark subtle gradient overlay on image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 transition group-hover:opacity-40" />

        {/* Video badge */}
        {dish.videoUrl && (
          <div
            title="Video preview available"
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/65 px-2.5 py-1 text-white backdrop-blur-md transition group-hover:bg-black/85"
          >
            <Play className="h-3 w-3 fill-white text-white" />
            <span className="text-[11px] font-medium tracking-wide">Video</span>
          </div>
        )}

        {/* Veg / Non-Veg badge */}
        <div className="absolute bottom-3 left-3">
          <span
            title={dish.isVeg ? "Vegetarian" : "Non-Vegetarian"}
            aria-label={dish.isVeg ? "Vegetarian" : "Non-Vegetarian"}
            className={`flex h-5 w-5 items-center justify-center rounded border bg-black/50 backdrop-blur-xs ${
              dish.isVeg ? "border-emerald-500" : "border-rose-500"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                dish.isVeg ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-white group-hover:text-white/90">
              {dish.name}
            </h3>

            <span className="shrink-0 text-base font-bold text-white">
              ₹{dish.price}
            </span>
          </div>

          {dish.description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/50 sm:text-sm">
              {dish.description}
            </p>
          )}
        </div>

        {dish.addonGroups && dish.addonGroups.length > 0 && (
          <div className="mt-3">
            <span className="inline-block rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/45">
              Customisable
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
