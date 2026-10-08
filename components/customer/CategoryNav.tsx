"use client";

import { useEffect, useRef } from "react";
import type { Category } from "@/types";

type CategoryNavProps = {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  totalDishCount?: number;
};

export default function CategoryNav({
  categories,
  activeCategory,
  onCategoryChange,
  totalDishCount = 0,
}: CategoryNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const sortedCategories = categories
    .filter((category) => category.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Auto-scroll the active category button horizontally inside the container ONLY
  // Never call button.scrollIntoView() as that scrolls the entire page window and causes freezing
  useEffect(() => {
    if (!activeCategory) return;
    const container = containerRef.current;
    const button = buttonRefs.current[activeCategory];
    if (!container || !button) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();

    const scrollOffset =
      buttonRect.left -
      containerRect.left -
      containerRect.width / 2 +
      buttonRect.width / 2;

    container.scrollBy({
      left: scrollOffset,
      behavior: "smooth",
    });
  }, [activeCategory]);

  const handleCategoryClick = (categoryId: string) => {
    onCategoryChange(categoryId);

    const targetSection = document.getElementById(categoryId === "all" ? "menu-content" : `category-${categoryId}`);
    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <nav
      aria-label="Menu categories"
      className="border-t border-[#f0e4dc] bg-transparent transition-colors"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          ref={containerRef}
          className="flex gap-2 overflow-x-auto py-3.5 scrollbar-none [-webkit-overflow-scrolling:touch]"
        >
          <button type="button" ref={(el) => { buttonRefs.current.all = el; }} onClick={() => handleCategoryClick("all")} aria-pressed={!activeCategory} className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--restaurant-primary)] ${!activeCategory ? "border-[var(--restaurant-primary)] bg-[var(--restaurant-primary)] text-white" : "border-[#e8d9cc] bg-white text-[var(--restaurant-text-muted)] hover:border-[var(--restaurant-primary)]/40"}`}>
            All <span className="ml-1 opacity-70">{totalDishCount}</span>
          </button>
          {sortedCategories.map((category) => {
            const isActive = category.id === activeCategory;

            return (
              <button
                key={category.id}
                ref={(el) => {
                  buttonRefs.current[category.id] = el;
                }}
                type="button"
                onClick={() => handleCategoryClick(category.id)}
                aria-pressed={isActive}
                aria-current={isActive ? "true" : undefined}
                className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--restaurant-primary)] ${
                  isActive
                    ? "border-[var(--restaurant-primary)] bg-[var(--restaurant-primary)] text-white shadow-sm"
                    : "border-[#e8d9cc] bg-white text-[var(--restaurant-text-muted)] hover:border-[var(--restaurant-primary)]/40 hover:text-[var(--restaurant-text)]"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
