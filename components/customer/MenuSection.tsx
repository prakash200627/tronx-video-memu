import type { Category, Dish } from "@/types";
import DishCard from "./DishCard";

type MenuSectionProps = {
  category: Category;
  dishes: Dish[];
  onDishClick: (dish: Dish) => void;
  isFirstCategory?: boolean;
};

export default function MenuSection({
  category,
  dishes,
  onDishClick,
  isFirstCategory = false,
}: MenuSectionProps) {
  const categoryDishes = dishes
    .filter((dish) => dish.categoryId === category.id && dish.isAvailable)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (categoryDishes.length === 0) {
    return null;
  }

  return (
    <section
      id={`category-${category.id}`}
      data-category-id={category.id}
      className="scroll-mt-20 sm:scroll-mt-24"
    >
      <div className="mb-4 flex items-baseline justify-between border-b border-white/5 pb-2">
        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          {category.name}
        </h2>

        <span className="text-xs font-medium text-white/40">
          {categoryDishes.length}{" "}
          {categoryDishes.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {categoryDishes.map((dish, index) => (
          <DishCard
            key={dish.id}
            dish={dish}
            onClick={onDishClick}
            priority={isFirstCategory && index < 2}
          />
        ))}
      </div>
    </section>
  );
}