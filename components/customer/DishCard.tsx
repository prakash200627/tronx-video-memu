"use client";

import Image from "next/image";
import { ArrowUpRight, Leaf, Utensils } from "lucide-react";
import { useState } from "react";
import type { Dish } from "@/types";
import VideoPlayer from "./VideoPlayer";

type DishCardProps = {
  dish: Dish;
  onClick: (dish: Dish) => void;
  priority?: boolean;
  videoMenuEnabled?: boolean;
};

export default function DishCard({
  dish,
  onClick,
  priority = false,
  videoMenuEnabled = true,
}: DishCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onClick(dish)}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      aria-label={`View details for ${dish.name}, ₹${dish.price}`}
      className="customer-card group flex w-full flex-col overflow-hidden border text-left transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--restaurant-primary)] focus-visible:ring-offset-2 active:scale-[0.99]"
    >
      <div className="relative aspect-[16/11] w-full overflow-hidden bg-[var(--restaurant-secondary)]">
        {dish.imageUrl ? (
          <Image
            src={dish.imageUrl}
            alt={dish.name}
            fill
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={videoMenuEnabled && dish.videoUrl ? "object-contain" : "object-cover transition duration-500 group-hover:scale-[1.03]"}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[var(--restaurant-secondary)] to-[var(--restaurant-primary)]">
            <Utensils className="h-8 w-8 text-white/45" />
          </div>
        )}

        {videoMenuEnabled && dish.videoUrl && (
          <VideoPlayer
            videoUrl={dish.videoUrl}
            posterUrl={dish.videoPosterUrl || dish.imageUrl}
            title={dish.name}
            autoPlay
            muted
            loop
            controls={false}
            hovered={hovered}
            className="absolute inset-0 bg-[var(--restaurant-secondary)]/80"
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/50 to-transparent" />

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span
            title={dish.isVeg ? "Vegetarian" : "Non-Vegetarian"}
            className={`flex h-5 w-5 items-center justify-center rounded-sm border bg-white/95 shadow-sm ${
              dish.isVeg ? "border-emerald-600" : "border-rose-700"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                dish.isVeg ? "bg-emerald-600" : "bg-rose-700"
              }`}
            />
          </span>
          {dish.isVeg && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-900 shadow-sm">
              <Leaf className="h-3 w-3" /> Veg
            </span>
          )}
        </div>

        {!dish.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--restaurant-text)]/65 backdrop-blur-sm">
            <span className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--restaurant-primary)]">
              Currently unavailable
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 border-t border-[#e8d9cc] bg-[var(--restaurant-background)] p-4 sm:p-5">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-serif text-lg font-bold leading-snug text-[var(--restaurant-text)] transition-colors group-hover:text-[var(--restaurant-primary)]">
              {dish.name}
            </h3>
            <span className="shrink-0 font-mono text-base font-bold text-[var(--restaurant-text)]">
              ₹{dish.price}
            </span>
          </div>
          {dish.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-[var(--restaurant-text-muted)]">
              {dish.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          {dish.addonGroups?.length ? (
            <span className="rounded-full bg-[var(--restaurant-primary)]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--restaurant-primary)]">
              Customisable
            </span>
          ) : (
            <span className="text-xs text-[var(--restaurant-text-muted)]">View dish</span>
          )}
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--restaurant-primary)] text-white transition group-hover:bg-[var(--restaurant-primary-dark)] group-hover:scale-105">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </button>
  );
}
