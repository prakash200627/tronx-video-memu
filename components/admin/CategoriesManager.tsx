"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FolderTree,
  Plus,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { Category } from "@/types";
import { api } from "@/lib/api";
import AdminModal from "@/components/admin/AdminModal";
import { categorySchema } from "@/lib/validations";

const categoryFormSchema = categorySchema.omit({ restaurantId: true });
type CategoryFormInput = z.input<typeof categoryFormSchema>;
type CategoryFormValues = z.output<typeof categoryFormSchema>;

type CategoriesManagerProps = {
  initialCategories: Category[];
  restaurantId: string;
};

export default function CategoriesManager({
  initialCategories,
  restaurantId,
}: CategoriesManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      sortOrder: categories.length + 1,
      isActive: true,
    },
  });

  const openCreate = () => {
    setEditing(null);
    setSubmitError(null);
    setFeedback(null);
    reset({
      name: "",
      description: "",
      sortOrder: categories.length + 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setSubmitError(null);
    setFeedback(null);
    reset({
      name: category.name,
      description: category.description ?? "",
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: CategoryFormValues) => {
    setSubmitError(null);
    try {
      if (editing) {
        const updated = await api.updateCategory(editing.id, values);
        setCategories((prev) =>
          prev
            .map((c) => (c.id === updated.id ? updated : c))
            .sort((a, b) => a.sortOrder - b.sortOrder),
        );
      } else {
        const created = await api.createCategory({
          ...values,
          restaurantId,
        });
        setCategories((prev) =>
          [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder),
        );
      }
      setModalOpen(false);
      setFeedback({
        type: "success",
        message: editing
          ? "Category updated successfully."
          : "Category created successfully.",
      });
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Save failed");
    }
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    try {
      await api.deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      setFeedback({
        type: "success",
        message: "Category deleted successfully.",
      });
      router.refresh();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Delete failed",
      });
    }
  };

  const toggleActive = async (category: Category) => {
    try {
      const updated = await api.updateCategory(category.id, {
        isActive: !category.isActive,
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
      setFeedback({
        type: "success",
        message: `Category ${updated.isActive ? "activated" : "hidden"} successfully.`,
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
            Categories
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Define menu sections and control their customer-facing presentation
            order.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black transition hover:bg-white/90"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
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
                <th className="py-3.5 pl-4 pr-2 w-12 text-center">Order</th>
                <th className="py-3.5 px-4">Category Name</th>
                <th className="py-3.5 px-4 hidden sm:table-cell">Slug</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 pr-4 pl-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-white/2 transition">
                  <td className="py-4 pl-4 pr-2 text-center">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-white/80">
                      {category.sortOrder}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-semibold text-white">
                    <div className="flex items-center gap-2.5">
                      <FolderTree className="h-4 w-4 text-white/40 shrink-0" />
                      <span>{category.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs font-mono text-white/50 hidden sm:table-cell">
                    #
                    {category.slug ||
                      category.name.toLowerCase().replace(/\s+/g, "-")}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActive(category)}
                      className="inline-flex"
                    >
                      {category.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-400">
                          <XCircle className="h-3 w-3" />
                          Hidden
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-4 pr-4 pl-2 text-right space-x-1">
                    <button
                      type="button"
                      onClick={() => openEdit(category)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white transition"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-300 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AdminModal
        title={editing ? "Edit Category" : "Add Category"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="category-form"
              disabled={isSubmitting}
              className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-white/90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        }
      >
        <form
          id="category-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {submitError ? (
            <p className="text-xs text-rose-400">{submitError}</p>
          ) : null}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">
              Name
            </label>
            <input
              {...register("name")}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-rose-400">
                {errors.name.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">
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
              <label className="mb-1.5 block text-xs font-medium text-white/60">
                Sort order
              </label>
              <input
                type="number"
                {...register("sortOrder", { valueAsNumber: true })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input type="checkbox" {...register("isActive")} />
                Active on menu
              </label>
            </div>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
