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
};

export default function DishCard({
  dish,
  onClick,
  priority = false,
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
      className="customer-card group flex w-full flex-col overflow-hidden rounded-3xl border text-left transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#602e31] focus-visible:ring-offset-2 active:scale-[0.99]"
    >
      <div className="relative aspect-[16/11] w-full overflow-hidden bg-[#2d1719]">
        {dish.imageUrl ? (
          <Image
            src={dish.imageUrl}
            alt={dish.name}
            fill
            priority={priority}
            loading={priority ? "eager" : "lazy"}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={dish.videoUrl ? "object-contain" : "object-cover transition duration-500 group-hover:scale-[1.03]"}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#2d1719] to-[#6a3338]">
            <Utensils className="h-8 w-8 text-white/45" />
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
            hovered={hovered}
            className="absolute inset-0 bg-[#2d1719]/80"
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
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#4d2326] shadow-sm">
              <Leaf className="h-3 w-3" /> Veg
            </span>
          )}
        </div>

        {!dish.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#241416]/65 backdrop-blur-sm">
            <span className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#602e31]">
              Currently unavailable
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 border-t border-[#e8d9cc] bg-white p-4 sm:p-5">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-serif text-lg font-bold leading-snug text-[#241416] transition-colors group-hover:text-[#602e31]">
              {dish.name}
            </h3>
            <span className="shrink-0 font-mono text-base font-bold text-[#241416]">
              ₹{dish.price}
            </span>
          </div>
          {dish.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-[#7e6568]">
              {dish.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          {dish.addonGroups?.length ? (
            <span className="rounded-full bg-[#f8efea] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#602e31]">
              Customisable
            </span>
          ) : (
            <span className="text-xs text-[#7e6568]">View dish</span>
          )}
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#602e31] text-white transition group-hover:bg-[#4d2326] group-hover:scale-105">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </button>
  );
}
