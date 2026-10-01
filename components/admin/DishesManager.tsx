"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  ArrowLeft,
  Video,
  Utensils,
  CheckCircle2,
  XCircle,
  Check,
  ChevronDown,
} from "lucide-react";
import type { AddonGroup, Category, Dish } from "@/types";
import { api } from "@/lib/api";
import { canUseNextImage } from "@/lib/image-url";
import AdminModal from "@/components/admin/AdminModal";
import MediaPicker from "@/components/admin/MediaPicker";
import { dishSchema } from "@/lib/validations";

const dishFormSchema = dishSchema.omit({ restaurantId: true });
type DishFormInput = z.input<typeof dishFormSchema>;
type DishFormValues = z.output<typeof dishFormSchema>;

type DishesManagerProps = {
  initialDishes: Dish[];
  categories: Category[];
  addonGroups: AddonGroup[];
  restaurantId: string;
};

export default function DishesManager({
  initialDishes,
  categories,
  addonGroups,
  restaurantId,
}: DishesManagerProps) {
  const router = useRouter();
  const [dishes, setDishes] = useState(initialDishes);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [mediaPickerType, setMediaPickerType] = useState<
    "IMAGE" | "VIDEO" | null
  >(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryOptionIndex, setCategoryOptionIndex] = useState(0);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DishFormInput, unknown, DishFormValues>({
    resolver: zodResolver(dishFormSchema),
    defaultValues: {
      categoryId: categories[0]?.id ?? "",
      name: "",
      description: "",
      price: 0,
      preparationTime: undefined,
      type: "VEG",
      isAvailable: true,
      isCustomizable: false,
      sortOrder: dishes.length + 1,
      addonGroupIds: [],
      imageUrl: "",
      videoUrl: "",
      videoPosterUrl: "",
    },
  });

  const selectedAddonGroupIds = watch("addonGroupIds") ?? [];
  const selectedCategoryId = watch("categoryId");
  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId,
  );

  useEffect(() => {
    if (!categoryOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setCategoryOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCategoryOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [categoryOpen]);

  const openCreate = () => {
    setEditing(null);
    setSubmitError(null);
    setFeedback(null);
    setCategoryOpen(false);
    reset({
      categoryId: categories[0]?.id ?? "",
      name: "",
      description: "",
      price: 0,
      type: "VEG",
      isAvailable: true,
      isCustomizable: false,
      sortOrder: dishes.length + 1,
      addonGroupIds: [],
      imageUrl: "",
      videoUrl: "",
      videoPosterUrl: "",
    });
    setModalOpen(true);
  };

  const openEdit = (dish: Dish) => {
    setEditing(dish);
    setSubmitError(null);
    setFeedback(null);
    setCategoryOpen(false);
    reset({
      categoryId: dish.categoryId,
      name: dish.name,
      description: dish.description ?? "",
      price: dish.price,
      preparationTime: dish.preparationTime,
      type: dish.type ?? (dish.isVeg ? "VEG" : "NON_VEG"),
      isAvailable: dish.isAvailable,
      isCustomizable: dish.isCustomizable ?? false,
      sortOrder: dish.sortOrder,
      addonGroupIds:
        dish.addonGroupIds ?? dish.addonGroups?.map((g) => g.id) ?? [],
      imageUrl: dish.imageUrl ?? dish.image ?? "",
      videoUrl: dish.videoUrl ?? dish.video ?? "",
      videoPosterUrl: dish.videoPosterUrl ?? "",
    });
    setModalOpen(true);
  };

  const toggleAddonGroup = (groupId: string) => {
    const current = selectedAddonGroupIds;
    const next = current.includes(groupId)
      ? current.filter((id) => id !== groupId)
      : [...current, groupId];
    setValue("addonGroupIds", next, { shouldDirty: true });
    setValue("isCustomizable", next.length > 0, { shouldDirty: true });
  };

  const onSubmit = async (values: DishFormValues) => {
    setSubmitError(null);
    const payload = {
      ...values,
      image: values.imageUrl || undefined,
      video: values.videoUrl || undefined,
      addonGroupIds: values.addonGroupIds ?? [],
      isCustomizable:
        values.isCustomizable ?? (values.addonGroupIds?.length ?? 0) > 0,
    };

    try {
      if (editing) {
        const updated = await api.updateDish(editing.id, payload);
        setDishes((prev) =>
          prev
            .map((d) => (d.id === updated.id ? updated : d))
            .sort((a, b) => a.sortOrder - b.sortOrder),
        );
      } else {
        const created = await api.createDish({
          ...payload,
          restaurantId,
        });
        setDishes((prev) =>
          [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder),
        );
      }
      setModalOpen(false);
      setFeedback({
        type: "success",
        message: editing
          ? "Dish updated successfully."
          : "Dish created successfully.",
      });
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const handleDelete = async (dish: Dish) => {
    if (!window.confirm(`Delete dish "${dish.name}"?`)) return;
    try {
      await api.deleteDish(dish.id);
      setDishes((prev) => prev.filter((d) => d.id !== dish.id));
      setFeedback({ type: "success", message: "Dish deleted successfully." });
      router.refresh();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Delete failed",
      });
    }
  };

  const toggleAvailability = async (dish: Dish) => {
    try {
      const updated = await api.updateDish(dish.id, {
        isAvailable: !dish.isAvailable,
      });
      setDishes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setFeedback({
        type: "success",
        message: `Dish ${updated.isAvailable ? "marked available" : "marked unavailable"}.`,
      });
      router.refresh();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Update failed",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/menu"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to Menu Hub</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Dishes
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Catalogue your food and drink offerings, prices, and video previews.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black transition hover:bg-white/90"
        >
          <Plus className="h-4 w-4" />
          <span>Add Dish</span>
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

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/2">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/2 text-xs font-semibold uppercase tracking-wider text-white/40">
              <tr>
                <th className="py-3.5 pl-4 pr-3">Dish</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4 text-center">Type</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 pr-4 pl-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dishes.map((dish) => {
                const categoryName =
                  categoryMap.get(dish.categoryId) || "Uncategorized";
                const hasVideo = Boolean(dish.videoUrl || dish.video);
                const imageSrc = dish.imageUrl || dish.image;

                return (
                  <tr key={dish.id} className="hover:bg-white/2 transition">
                    <td className="py-4 pl-4 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                          {imageSrc ? (
                            canUseNextImage(imageSrc) ? (
                              <Image
                                src={imageSrc}
                                alt={dish.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <img
                                src={imageSrc}
                                alt={dish.name}
                                className="h-full w-full object-cover"
                              />
                            )
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-white/20">
                              <Utensils className="h-5 w-5" />
                            </div>
                          )}
                          {hasVideo ? (
                            <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/80 text-[9px] text-white">
                              ▶
                            </span>
                          ) : null}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">
                              {dish.name}
                            </span>
                            {hasVideo ? (
                              <span className="inline-flex items-center gap-1 rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-purple-300">
                                <Video className="h-2.5 w-2.5" />
                                Video
                              </span>
                            ) : null}
                          </div>
                          {dish.description ? (
                            <p className="line-clamp-1 text-xs text-white/45 max-w-sm">
                              {dish.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs font-medium text-white/70 hidden md:table-cell">
                      {categoryName}
                    </td>
                    <td className="py-4 px-4 font-bold text-white">
                      ₹{dish.price}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded border ${
                          dish.isVeg ? "border-emerald-500" : "border-rose-500"
                        }`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            dish.isVeg ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleAvailability(dish)}
                      >
                        {dish.isAvailable ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            In Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-400">
                            <XCircle className="h-3 w-3" />
                            Sold Out
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-4 pr-4 pl-2 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => openEdit(dish)}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(dish)}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium text-rose-400/80 hover:bg-rose-500/10 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AdminModal
        title={editing ? "Edit Dish" : "Add Dish"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/70"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="dish-form"
              disabled={isSubmitting}
              className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        }
      >
        <form
          id="dish-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3 max-h-[60vh] overflow-y-auto pr-1"
        >
          {submitError ? (
            <p className="text-xs text-rose-400">{submitError}</p>
          ) : null}
          <div>
            <label className="mb-1 block text-xs text-white/60">Name</label>
            <input
              {...register("name")}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
            {errors.name ? (
              <p className="text-xs text-rose-400">{errors.name.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Category</label>
            <div ref={categoryDropdownRef} className="relative">
              <input type="hidden" {...register("categoryId")} />
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={categoryOpen}
                onClick={() => {
                  setCategoryOpen((open) => !open);
                  setCategoryOptionIndex(
                    Math.max(
                      0,
                      categories.findIndex(
                        (category) => category.id === selectedCategoryId,
                      ),
                    ),
                  );
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setCategoryOpen(false);
                    return;
                  }
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    if (!categoryOpen) {
                      setCategoryOpen(true);
                      return;
                    }
                    setCategoryOptionIndex((current) => {
                      const direction = event.key === "ArrowDown" ? 1 : -1;
                      return Math.min(
                        Math.max(current + direction, 0),
                        Math.max(categories.length - 1, 0),
                      );
                    });
                  }
                  if (
                    categoryOpen &&
                    (event.key === "Enter" || event.key === " ") &&
                    categories[categoryOptionIndex]
                  ) {
                    event.preventDefault();
                    setValue("categoryId", categories[categoryOptionIndex].id, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setCategoryOpen(false);
                  }
                }}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/30"
              >
                <span
                  className={selectedCategory ? "text-white" : "text-white/40"}
                >
                  {selectedCategory?.name ?? "Select a category"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-white/50 transition-transform ${
                    categoryOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {categoryOpen ? (
                <div
                  role="listbox"
                  aria-label="Categories"
                  className="absolute left-0 right-0 z-30 mt-2 max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 p-1 shadow-2xl"
                >
                  {categories.map((category, index) => {
                    const isSelected = category.id === selectedCategoryId;
                    const isKeyboardFocused = index === categoryOptionIndex;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setCategoryOptionIndex(index)}
                        onClick={() => {
                          setValue("categoryId", category.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setCategoryOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                          isSelected || isKeyboardFocused
                            ? "bg-white/10 text-white"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span>{category.name}</span>
                        {isSelected ? <Check className="h-4 w-4" /> : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            {errors.categoryId ? (
              <p className="mt-1 text-xs text-rose-400">
                {errors.categoryId.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/60">
                Price (₹)
              </label>
              <input
                type="number"
                step="1"
                {...register("price", { valueAsNumber: true })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/60">
                Preparation time (min)
              </label>
              <input
                type="number"
                min="0"
                {...register("preparationTime", { valueAsNumber: true })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
              {errors.preparationTime ? (
                <p className="mt-1 text-xs text-rose-400">
                  {errors.preparationTime.message}
                </p>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/60">
                Sort order
              </label>
              <input
                type="number"
                {...register("sortOrder", { valueAsNumber: true })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-white/80">
            <label className="flex items-center gap-2">
              <select
                {...register("type")}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm"
              >
                <option value="VEG">Vegetarian</option>
                <option value="NON_VEG">Non-Veg</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("isAvailable")} />
              Available
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("isCustomizable")} />
              Customisable
            </label>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">
              Image URL
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                {...register("imageUrl")}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
              <button
                type="button"
                onClick={() => setMediaPickerType("IMAGE")}
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                Select from Media Library
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">
              Video URL
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                {...register("videoUrl")}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
              <button
                type="button"
                onClick={() => setMediaPickerType("VIDEO")}
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                Select from Media Library
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">
              Video poster URL
            </label>
            <input
              {...register("videoPosterUrl")}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-white/60">
              Assigned add-on groups
            </p>
            <div className="space-y-2 rounded-xl border border-white/10 bg-white/2 p-3">
              {addonGroups.length === 0 ? (
                <p className="text-xs text-white/40">No add-on groups yet.</p>
              ) : (
                addonGroups.map((group) => (
                  <label
                    key={group.id}
                    className="flex items-center gap-2 text-sm text-white/80"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAddonGroupIds.includes(group.id)}
                      onChange={() => toggleAddonGroup(group.id)}
                    />
                    {group.name}
                  </label>
                ))
              )}
            </div>
          </div>
        </form>
      </AdminModal>

      <MediaPicker
        open={mediaPickerType !== null}
        mediaType={mediaPickerType ?? "IMAGE"}
        restaurantId={restaurantId}
        onClose={() => setMediaPickerType(null)}
        onSelect={(media) => {
          if (mediaPickerType === "IMAGE") {
            setValue("imageUrl", media.url, {
              shouldDirty: true,
              shouldValidate: true,
            });
          } else if (mediaPickerType === "VIDEO") {
            setValue("videoUrl", media.url, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }
        }}
      />
    </div>
  );
}
