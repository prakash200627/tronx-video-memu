"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import type { Dish, Restaurant } from "@/types";
import { api } from "@/lib/api";

type AvailabilityManagerProps = {
  initialDishes: Dish[];
  restaurant: Restaurant;
};

export default function AvailabilityManager({
  initialDishes,
  restaurant: initialRestaurant,
}: AvailabilityManagerProps) {
  const router = useRouter();
  const [dishes, setDishes] = useState(initialDishes);
  const [restaurant, setRestaurant] = useState(initialRestaurant);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [restaurantPending, setRestaurantPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const toggle = async (dish: Dish) => {
    setPendingId(dish.id);
    try {
      const updated = await api.updateDish(dish.id, {
        isAvailable: !dish.isAvailable,
      });
      setDishes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setFeedback({
        type: "success",
        message: `${dish.name} availability updated.`,
      });
      router.refresh();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Update failed",
      });
    } finally {
      setPendingId(null);
    }
  };

  const toggleRestaurant = async () => {
    setRestaurantPending(true);
    setFeedback(null);
    try {
      const updated = await api.updateRestaurant(restaurant.id, {
        isOpen: !restaurant.isOpen,
      });
      setRestaurant(updated);
      setFeedback({
        type: "success",
        message: `Restaurant marked ${updated.isOpen ? "open" : "closed"}.`,
      });
      router.refresh();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Update failed",
      });
    } finally {
      setRestaurantPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Availability & 86 Hub
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Instantly mark sold-out items or hide whole categories from customers
          in real time.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/2 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">Restaurant status</p>
          <p className="mt-1 text-xs text-white/50">
            Controls whether the restaurant is currently open to customers.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleRestaurant}
          disabled={restaurantPending}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
            restaurant.isOpen
              ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
          }`}
        >
          {restaurant.isOpen ? "Open" : "Closed"}
        </button>
      </div>

      {feedback ? (
        <p
          role="status"
          className={`text-sm ${
            feedback.type === "success" ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/2 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-white/50" />
          <span className="text-sm font-medium text-white/80">
            {dishes.filter((d) => d.isAvailable).length} of {dishes.length}{" "}
            dishes in stock
          </span>
        </div>
        <span className="text-xs text-white/40">
          Changes reflect on the customer menu after refresh or tab focus
        </span>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
          Dishes Stock Status
        </h2>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/2 divide-y divide-white/5">
          {dishes.map((dish) => (
            <div
              key={dish.id}
              className="flex items-center justify-between p-4 transition hover:bg-white/2"
            >
              <div>
                <span className="font-semibold text-white text-sm">
                  {dish.name}
                </span>
                <span className="ml-2 text-xs font-mono text-white/40">
                  ₹{dish.price}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {dish.isAvailable ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400">
                    <XCircle className="h-3.5 w-3.5" />
                    Sold Out
                  </span>
                )}

                <button
                  type="button"
                  disabled={pendingId === dish.id}
                  onClick={() => toggle(dish)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  Toggle
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
