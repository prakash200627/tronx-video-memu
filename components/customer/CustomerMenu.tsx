"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dish, RestaurantMenu } from "@/types";
import CategoryNav from "@/components/customer/CategoryNav";
import MenuSection from "@/components/customer/MenuSection";
import RestaurantHero from "@/components/customer/RestaurantHero";
import DishDetailModal from "@/components/customer/DishDetailModal";
import { api } from "@/lib/api";

type CustomerMenuProps = {
  initialMenu: RestaurantMenu;
  restaurantIdOrSlug: string;
};

export default function CustomerMenu({
  initialMenu,
  restaurantIdOrSlug,
}: CustomerMenuProps) {
  const [refreshResult, setRefreshResult] = useState<{
    restaurantIdOrSlug: string;
    menu: RestaurantMenu;
  } | null>(null);
  const menu =
    refreshResult?.restaurantIdOrSlug === restaurantIdOrSlug
      ? refreshResult.menu
      : initialMenu;

  const activeCategories = menu.categories
    .filter((category) => category.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const [activeCategory, setActiveCategory] = useState(
    () => activeCategories[0]?.id ?? "",
  );

  const activeCategoryId = activeCategories.some(
    (category) => category.id === activeCategory,
  )
    ? activeCategory
    : (activeCategories[0]?.id ?? "");
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const selectedDish =
    menu.dishes.find((dish) => dish.id === selectedDishId) ?? null;

  const isManualScrolling = useRef(false);
  const manualScrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const refreshMenu = useCallback(async () => {
    try {
      const next = await api.getPublicMenu(restaurantIdOrSlug);
      setRefreshResult({ restaurantIdOrSlug, menu: next });
    } catch {
      return;
    }
  }, [restaurantIdOrSlug]);

  useEffect(() => {
    const onFocus = () => {
      void refreshMenu();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshMenu]);

  const handleCategorySelect = (categoryId: string) => {
    isManualScrolling.current = true;
    setActiveCategory(categoryId);

    if (manualScrollTimeout.current) {
      clearTimeout(manualScrollTimeout.current);
    }

    manualScrollTimeout.current = setTimeout(() => {
      isManualScrolling.current = false;
    }, 750);
  };

  useEffect(() => {
    if (activeCategories.length === 0) return;

    const observerCallback: IntersectionObserverCallback = () => {
      if (isManualScrolling.current) return;

      if (window.scrollY < 100) {
        const firstId = activeCategories[0].id;
        setActiveCategory((prev) => (prev === firstId ? prev : firstId));
        return;
      }

      const current = activeCategories.find((cat) => {
        const el = document.getElementById(`category-${cat.id}`);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top <= 120 && rect.bottom > 100;
      });

      if (current) {
        setActiveCategory((prev) => (prev === current.id ? prev : current.id));
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "-60px 0px -40% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1.0],
    });

    activeCategories.forEach((cat) => {
      const element = document.getElementById(`category-${cat.id}`);
      if (element) {
        observer.observe(element);
      }
    });

    const handleScroll = () => {
      if (isManualScrolling.current) return;
      const isAtBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 40;

      if (isAtBottom && activeCategories.length > 0) {
        const lastCategoryId = activeCategories[activeCategories.length - 1].id;
        setActiveCategory((prev) =>
          prev === lastCategoryId ? prev : lastCategoryId,
        );
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      if (manualScrollTimeout.current) {
        clearTimeout(manualScrollTimeout.current);
      }
    };
  }, [activeCategories]);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white/20">
      <RestaurantHero restaurant={menu.restaurant} />

      <CategoryNav
        categories={activeCategories}
        activeCategory={activeCategoryId}
        onCategoryChange={handleCategorySelect}
      />

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-8 sm:px-8 sm:py-10">
        {activeCategories.map((category, index) => (
          <MenuSection
            key={category.id}
            category={category}
            dishes={menu.dishes}
            onDishClick={(dish: Dish) => setSelectedDishId(dish.id)}
            isFirstCategory={index === 0}
          />
        ))}
      </div>

      {selectedDish ? (
        <DishDetailModal
          key={selectedDish.id}
          dish={selectedDish}
          onClose={() => setSelectedDishId(null)}
        />
      ) : null}
    </main>
  );
}
