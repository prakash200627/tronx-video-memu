"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, MapPin, Clock } from "lucide-react";
import type { Restaurant } from "@/types";
import { api } from "@/lib/api";
import { restaurantAdminProfileSchema } from "@/lib/validations";

const profileFormSchema = restaurantAdminProfileSchema;
type ProfileFormInput = z.input<typeof profileFormSchema>;
type ProfileFormValues = z.output<typeof profileFormSchema>;

type RestaurantProfileFormProps = {
  restaurant: Restaurant;
  restaurantId: string;
};

export default function RestaurantProfileForm({
  restaurant,
  restaurantId,
}: RestaurantProfileFormProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: restaurant.name,
      logoUrl: restaurant.logoUrl ?? restaurant.logo ?? "",
      coverUrl: restaurant.coverUrl ?? restaurant.coverImage ?? "",
      description: restaurant.description ?? "",
      tagline: restaurant.tagline ?? "",
      phone: restaurant.phone ?? "",
      email: restaurant.email ?? "",
      address: restaurant.address ?? "",
      openingHours: restaurant.openingHours ?? "",
      currency: restaurant.currency ?? "INR",
      isOpen: restaurant.isOpen,
      socialLinks: {
        instagram: restaurant.socialLinks?.instagram ?? "",
        facebook: restaurant.socialLinks?.facebook ?? "",
        twitter: restaurant.socialLinks?.twitter ?? "",
        website: restaurant.socialLinks?.website ?? "",
      },
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setError(null);
    setSaved(false);
    try {
      await api.updateRestaurant(restaurantId, {
        ...values,
        logo: values.logoUrl,
        coverImage: values.coverUrl,
        email: values.email || undefined,
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Restaurant Profile
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Manage your restaurant profile and customer-facing contact details.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-white/10 bg-white/2 p-6 space-y-6"
      >
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        {saved ? (
          <p className="text-sm text-emerald-400">
            Profile saved successfully.
          </p>
        ) : null}

        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
            Brand Identity
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Restaurant Name
              </label>
              <input
                {...register("name")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
              />
              {errors.name ? (
                <p className="mt-1 text-xs text-rose-400">
                  {errors.name.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Logo URL
              </label>
              <input
                {...register("logoUrl")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Cover image URL
              </label>
              <input
                {...register("coverUrl")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Tagline
            </label>
            <input
              {...register("tagline")}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white"
            />
            {errors.tagline ? (
              <p className="mt-1 text-xs text-rose-400">
                {errors.tagline.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              {...register("description")}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:outline-none"
            />
            {errors.description ? (
              <p className="mt-1 text-xs text-rose-400">
                {errors.description.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 border-t border-white/10 pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
            Contact & Timings
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Phone Number
              </label>
              <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
                <Phone className="h-4 w-4 text-white/40 mr-2.5" />
                <input
                  {...register("phone")}
                  className="w-full bg-transparent text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Email
              </label>
              <input
                type="email"
                {...register("email")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white"
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-rose-400">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Opening Hours
              </label>
              <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
                <Clock className="h-4 w-4 text-white/40 mr-2.5" />
                <input
                  {...register("openingHours")}
                  className="w-full bg-transparent text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Currency
              </label>
              <input
                {...register("currency")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white"
              />
              {errors.currency ? (
                <p className="mt-1 text-xs text-rose-400">
                  {errors.currency.message}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Physical Address
            </label>
            <div className="flex items-start rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
              <MapPin className="h-4 w-4 text-white/40 mr-2.5 mt-0.5" />
              <textarea
                rows={2}
                {...register("address")}
                className="w-full bg-transparent text-sm text-white leading-relaxed focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-white/10 pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
            Social Links
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              {...register("socialLinks.instagram")}
              placeholder="Instagram URL"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
            <input
              {...register("socialLinks.facebook")}
              placeholder="Facebook URL"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
            <input
              {...register("socialLinks.twitter")}
              placeholder="Twitter / X URL"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
            <input
              {...register("socialLinks.website")}
              placeholder="Website URL"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="block font-medium text-white text-sm">
              Live Operating Status
            </span>
            <span className="block text-xs text-white/50">
              Control whether the menu indicates the restaurant is actively
              taking diners.
            </span>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-white/80">
            <input type="checkbox" {...register("isOpen")} />
            Open for service
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black hover:bg-white/90 disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
