import type { Category, Dish } from "@/types";
import DishCard from "./DishCard";

type MenuSectionProps = {
  category: Category;
  dishes: Dish[];
  onDishClick: (dish: Dish) => void;
  isFirstCategory?: boolean;
  videoMenuEnabled?: boolean;
};

export default function MenuSection({
  category,
  dishes,
  onDishClick,
  isFirstCategory = false,
  videoMenuEnabled = true,
}: MenuSectionProps) {
  const categoryDishes = dishes
    .filter((dish) => dish.categoryId === category.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (categoryDishes.length === 0) {
    return null;
  }

  return (
    <section
      id={`category-${category.id}`}
      data-category-id={category.id}
      className="scroll-mt-32 sm:scroll-mt-36"
    >
      <div className="mb-6 flex flex-col items-center border-b border-[#e8d9cc] pb-5 text-center">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--restaurant-primary)]">From our kitchen</p>
        <h2 className="font-serif text-3xl font-bold tracking-tight text-[var(--restaurant-text)] sm:text-4xl">
          {category.name}
        </h2>
        <span className="mt-2 text-xs font-medium text-[var(--restaurant-text-muted)]">
          {categoryDishes.length}{" "}
          {categoryDishes.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {categoryDishes.map((dish, index) => (
          <DishCard
            key={dish.id}
            dish={dish}
            onClick={onDishClick}
            priority={isFirstCategory && index < 2}
            videoMenuEnabled={videoMenuEnabled}
          />
        ))}
      </div>
    </section>
  );
}
