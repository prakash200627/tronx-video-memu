"use client";

import { useEffect, useRef } from "react";
import type { Category } from "@/types";

type CategoryNavProps = {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
};

export default function CategoryNav({
  categories,
  activeCategory,
  onCategoryChange,
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

    const targetSection = document.getElementById(`category-${categoryId}`);
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
      className="sticky top-0 z-30 border-b border-white/10 bg-black/85 backdrop-blur-md transition-colors"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-8">
        <div
          ref={containerRef}
          className="flex gap-2 overflow-x-auto py-3.5 scrollbar-none [-webkit-overflow-scrolling:touch]"
        >
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
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  isActive
                    ? "bg-white text-black shadow-md shadow-white/10"
                    : "bg-white/[0.06] text-white/70 hover:bg-white/12 hover:text-white"
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