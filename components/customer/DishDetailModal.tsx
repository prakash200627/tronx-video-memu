"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import { X, Sparkles, Check } from "lucide-react";
import type { Dish, AddonGroup, Addon } from "@/types";
import VideoPlayer from "./VideoPlayer";

type DishDetailModalProps = {
  dish: Dish | null;
  onClose: () => void;
};

function createInitialAddonSelections(dish: Dish | null) {
  const selections: Record<string, string[]> = {};
  for (const group of dish?.addonGroups ?? []) {
    selections[group.id] =
      group.isRequired && group.maxSelect === 1 && group.addons.length > 0
        ? [group.addons[0].id]
        : [];
  }
  return selections;
}

export default function DishDetailModal({
  dish,
  onClose,
}: DishDetailModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const savedScrollTopRef = useRef<number>(0);

  const [selectionState, setSelectionState] = useState<{
    dishId: string | null;
    values: Record<string, string[]>;
  }>({ dishId: null, values: {} });
  const selectedAddons =
    dish && selectionState.dishId === dish.id
      ? selectionState.values
      : createInitialAddonSelections(dish);

  // Reset scroll to top when a new dish is opened.
  useEffect(() => {
    if (!dish?.id) return;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [dish?.id]); // Only re-run when the dish ID actually changes, not on every render

  const updateGroupSelection = (
    group: AddonGroup,
    update: (current: string[]) => string[],
  ) => {
    if (!dish) return;
    setSelectionState((previous) => {
      const currentValues =
        previous.dishId === dish.id
          ? previous.values
          : createInitialAddonSelections(dish);
      return {
        dishId: dish.id,
        values: {
          ...currentValues,
          [group.id]: update(currentValues[group.id] ?? []),
        },
      };
    });
  };

  // Body scroll lock and Escape key listener
  useEffect(() => {
    if (!dish) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus close button on open for accessibility without scrolling viewport
    closeButtonRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dish, onClose]);

  // Calculate total price based on base price and selected addons
  const addonsTotal = useMemo(() => {
    if (!dish || !dish.addonGroups) return 0;
    let total = 0;

    dish.addonGroups.forEach((group) => {
      const selectedIds = selectedAddons[group.id] || [];
      group.addons.forEach((addon) => {
        if (selectedIds.includes(addon.id)) {
          total += addon.price;
        }
      });
    });

    return total;
  }, [dish, selectedAddons]);

  const totalPrice = (dish?.price ?? 0) + addonsTotal;

  // Toggle selection for single-select (radio) and multi-select (checkbox)
  // Maintains strictly stable scroll position across re-renders
  const handleToggleAddon = (group: AddonGroup, addon: Addon) => {
    // 1. Capture exact current scroll position before state update
    if (scrollContainerRef.current) {
      savedScrollTopRef.current = scrollContainerRef.current.scrollTop;
    }

    const current = selectedAddons[group.id] || [];
    const isSelected = current.includes(addon.id);

    if (group.maxSelect === 1) {
      // Radio mode: selection replaces previous choice
      if (isSelected) {
        // If optional, allow unchecking; if required, keep selected
        if (!group.isRequired) {
          updateGroupSelection(group, () => []);
        }
      } else {
        updateGroupSelection(group, () => [addon.id]);
      }
    } else {
      // Checkbox mode: toggle up to maxSelect
      if (isSelected) {
        updateGroupSelection(group, (previous) =>
          previous.filter((id) => id !== addon.id),
        );
      } else {
        if (current.length < group.maxSelect) {
          updateGroupSelection(group, (previous) => [...previous, addon.id]);
        }
      }
    }

    // 2. Restore exact scroll position on the next animation frame to prevent browser focus jumping
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = savedScrollTopRef.current;
      }
    });
  };

  if (!dish) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dish-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-md sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-full flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-zinc-950 text-white shadow-2xl sm:max-h-[88vh] sm:max-w-2xl sm:rounded-3xl sm:border-white/15 lg:max-w-3xl">
        {/* Mobile Swipe / Drag Pill Handle */}
        <div className="flex w-full items-center justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-white/25" />
        </div>

        {/* Accessible Close Button */}
        <div className="absolute right-4 top-4 z-20">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close dish details"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/75 text-white/90 backdrop-blur-md transition hover:bg-black hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 
          PRIMARY SCROLLABLE CONTENT CONTAINER:
          - Single scrollable region for all modal content
          - scrollbar-none hides the visible scrollbar on Chrome, Edge, Firefox, and Safari
          - mouse wheel, touch, and trackpad scrolling remain completely functional
        */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain scrollbar-none"
        >
          {/* 1. MEDIA AREA */}
          <div className="relative w-full">
            {dish.videoUrl ? (
              <div className="p-3 sm:p-5">
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-900">
                  {dish.imageUrl && (
                    <Image
                      src={dish.imageUrl}
                      alt={dish.name}
                      fill
                      priority
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 768px, 896px"
                      className="object-cover"
                    />
                  )}
                  <VideoPlayer
                    videoUrl={dish.videoUrl}
                    posterUrl={dish.videoPosterUrl || dish.imageUrl}
                    title={dish.name}
                    autoPlay
                    muted
                    loop
                    controls={false}
                    playbackPriority
                    className="absolute inset-0 !aspect-auto rounded-2xl bg-transparent"
                  />
                </div>
              </div>
            ) : dish.imageUrl ? (
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900 sm:aspect-[16/9]">
                <Image
                  src={dish.imageUrl}
                  alt={dish.name}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 768px, 896px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/25 to-transparent" />
              </div>
            ) : (
              <div className="relative flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
                <div className="flex flex-col items-center gap-2 text-white/40">
                  <Sparkles className="h-8 w-8 text-white/30" />
                  <span className="text-xs uppercase tracking-wider text-white/50">
                    TRONX Video Menu
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. DISH INFORMATION & CONTENT */}
          <div className="space-y-6 px-5 pb-8 pt-2 sm:px-8">
            {/* Dish Info: Name, Price, Veg/Non-veg & Customisable badge */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Veg / Non-Veg Indicator */}
                <span
                  title={dish.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                  aria-label={dish.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                  className={`flex h-5 w-5 items-center justify-center rounded border bg-black/40 ${
                    dish.isVeg ? "border-emerald-500" : "border-rose-500"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      dish.isVeg ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                </span>

                <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  {dish.isVeg ? "Pure Veg" : "Non-Veg"}
                </span>

                {dish.addonGroups && dish.addonGroups.length > 0 && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/60">
                    Customisable
                  </span>
                )}
              </div>

              {/* Title & Price */}
              <div className="flex items-start justify-between gap-4">
                <h2
                  id="dish-modal-title"
                  className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
                >
                  {dish.name}
                </h2>

                <div className="shrink-0 text-right">
                  <span className="text-2xl font-extrabold text-white sm:text-3xl">
                    ₹{dish.price}
                  </span>
                </div>
              </div>

              {/* Description */}
              {dish.description && (
                <p className="text-sm leading-relaxed text-white/65 sm:text-base">
                  {dish.description}
                </p>
              )}
            </div>

            {/* 3. ADD-ONS SECTION */}
            {dish.addonGroups && dish.addonGroups.length > 0 && (
              <div className="space-y-6 border-t border-white/10 pt-6">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-white">
                    Customise Your Dish
                  </h3>
                  <p className="mt-0.5 text-xs text-white/50">
                    Select your preferred add-ons and accompaniments below.
                  </p>
                </div>

                <div className="space-y-5">
                  {dish.addonGroups.map((group) => {
                    const currentSelections = selectedAddons[group.id] || [];
                    const isSingleSelect = group.maxSelect === 1;
                    const isMaxReached =
                      !isSingleSelect &&
                      currentSelections.length >= group.maxSelect;

                    return (
                      <div
                        key={group.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition sm:p-5"
                      >
                        {/* Group Header (Stable height) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-white">
                              {group.name}
                            </span>
                            {group.isRequired ? (
                              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
                                Required
                              </span>
                            ) : (
                              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/50">
                                Optional
                              </span>
                            )}
                          </div>

                          {/* Rule hints */}
                          <div className="text-xs text-white/50">
                            {isSingleSelect
                              ? "Choose 1"
                              : group.minSelect > 0
                                ? `Choose ${group.minSelect}–${group.maxSelect}`
                                : `Up to ${group.maxSelect}`}
                          </div>
                        </div>

                        {/* Add-on Options List */}
                        <div className="divide-y divide-white/5 pt-1">
                          {group.addons.map((addon) => {
                            const isSelected = currentSelections.includes(
                              addon.id,
                            );
                            const isDisabled =
                              !isSelected && isMaxReached && !isSingleSelect;
                            const inputId = `addon-${group.id}-${addon.id}`;

                            return (
                              <label
                                key={addon.id}
                                className={`relative flex items-center justify-between rounded-xl px-2 py-3 transition select-none ${
                                  isDisabled
                                    ? "cursor-not-allowed opacity-40"
                                    : "cursor-pointer hover:bg-white/[0.03]"
                                } ${isSelected ? "bg-white/[0.03]" : ""}`}
                              >
                                {/* 
                                  Controlled Accessible Input:
                                  Occupies full row (absolute inset-0) so focus never creates an offset scroll delta
                                */}
                                <input
                                  id={inputId}
                                  type={isSingleSelect ? "radio" : "checkbox"}
                                  name={`addon-group-${group.id}`}
                                  checked={isSelected}
                                  disabled={isDisabled}
                                  onChange={() =>
                                    handleToggleAddon(group, addon)
                                  }
                                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                                  aria-label={`${addon.name}, ${
                                    addon.price > 0 ? `₹${addon.price}` : "Free"
                                  }`}
                                />

                                <div className="flex items-center gap-3">
                                  {/* Visual radio/checkbox indicator */}
                                  <div
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center transition ${
                                      isSingleSelect
                                        ? "rounded-full border"
                                        : "rounded-md border"
                                    } ${
                                      isSelected
                                        ? "border-white bg-white text-black shadow-xs"
                                        : "border-white/30 bg-transparent"
                                    }`}
                                  >
                                    {isSelected &&
                                      (isSingleSelect ? (
                                        <div className="h-2 w-2 rounded-full bg-black" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                                      ))}
                                  </div>

                                  <span
                                    className={`text-sm sm:text-base ${
                                      isSelected
                                        ? "font-medium text-white"
                                        : "text-white/80"
                                    }`}
                                  >
                                    {addon.name}
                                  </span>
                                </div>

                                <span className="text-sm font-semibold text-white/80">
                                  {addon.price > 0
                                    ? `+₹${addon.price}`
                                    : "Free"}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 
          4. FIXED/STICKY BOTTOM ACTION BAR:
          - Does not scroll with modal content
          - Always visible at the bottom of the modal card
        */}
        <div className="shrink-0 border-t border-white/10 bg-zinc-950 px-5 py-4 backdrop-blur-md sm:px-8 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="block text-xs uppercase tracking-wider text-white/50">
                Total Price
              </span>
              <span className="text-xl font-extrabold text-white sm:text-2xl">
                ₹{totalPrice}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 max-w-xs rounded-2xl bg-white py-3.5 text-center text-sm font-bold text-black transition hover:bg-white/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
