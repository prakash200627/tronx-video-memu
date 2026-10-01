"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Restaurant } from "@/types";

type RestaurantFields = {
  name: string;
  slug: string;
  description: string;
  tagline: string;
  logo: string;
  coverImage: string;
  phone: string;
  email: string;
  address: string;
  openingHours: string;
  currency: string;
  socialLinks: {
    instagram: string;
    facebook: string;
    twitter: string;
    website: string;
  };
  isOpen: boolean;
  isActive: boolean;
};

const emptyFields: RestaurantFields = {
  name: "",
  slug: "",
  description: "",
  tagline: "",
  logo: "",
  coverImage: "",
  phone: "",
  email: "",
  address: "",
  openingHours: "",
  currency: "INR",
  socialLinks: {
    instagram: "",
    facebook: "",
    twitter: "",
    website: "",
  },
  isOpen: true,
  isActive: true,
};

export default function RestaurantEditor({
  restaurant,
}: {
  restaurant?: Restaurant;
}) {
  const router = useRouter();
  const [fields, setFields] = useState<RestaurantFields>(() =>
    restaurant
      ? {
          name: restaurant.name,
          slug: restaurant.slug,
          description: restaurant.description ?? "",
          tagline: restaurant.tagline ?? "",
          logo: restaurant.logo ?? restaurant.logoUrl ?? "",
          coverImage: restaurant.coverImage ?? restaurant.coverUrl ?? "",
          phone: restaurant.phone ?? "",
          email: restaurant.email ?? "",
          address: restaurant.address ?? "",
          openingHours: restaurant.openingHours ?? "",
          currency: restaurant.currency ?? "INR",
          socialLinks: {
            instagram: restaurant.socialLinks?.instagram ?? "",
            facebook: restaurant.socialLinks?.facebook ?? "",
            twitter: restaurant.socialLinks?.twitter ?? "",
            website: restaurant.socialLinks?.website ?? "",
          },
          isOpen: restaurant.isOpen,
          isActive: restaurant.isActive !== false,
        }
      : emptyFields,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const setField = <K extends keyof RestaurantFields>(
    key: K,
    value: RestaurantFields[K],
  ) => setFields((current) => ({ ...current, [key]: value }));

  const setSocialLink = (
    key: keyof RestaurantFields["socialLinks"],
    value: string,
  ) =>
    setFields((current) => ({
      ...current,
      socialLinks: { ...current.socialLinks, [key]: value },
    }));

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch(
        restaurant ? `/api/restaurants/${restaurant.id}` : "/api/restaurants",
        {
          method: restaurant ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        },
      );
      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Restaurant could not be saved");
      }
      router.push("/super-admin");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Restaurant could not be saved",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">
          {restaurant ? "Edit restaurant" : "Add restaurant"}
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Restaurant ID is kept equal to its public slug.
        </p>
      </div>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm text-white/70">
          Restaurant name
          <input
            required
            minLength={2}
            value={fields.name}
            onChange={(event) => setField("name", event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white"
          />
        </label>
        <label className="space-y-1.5 text-sm text-white/70">
          Public slug
          <input
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            value={fields.slug}
            onChange={(event) => setField("slug", event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white"
          />
        </label>
        <label className="space-y-1.5 text-sm text-white/70 sm:col-span-2">
          Description
          <textarea
            rows={3}
            value={fields.description}
            onChange={(event) => setField("description", event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white"
          />
        </label>
        <label className="space-y-1.5 text-sm text-white/70 sm:col-span-2">
          Tagline
          <input
            value={fields.tagline}
            onChange={(event) => setField("tagline", event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white"
          />
        </label>
        <label className="space-y-1.5 text-sm text-white/70">
          Logo URL
          <input
            type="url"
            value={fields.logo}
            onChange={(event) => setField("logo", event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white"
          />
        </label>
        <label className="space-y-1.5 text-sm text-white/70">
          Cover image URL
          <input
            type="url"
            value={fields.coverImage}
            onChange={(event) => setField("coverImage", event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white"
          />
        </label>
        <label className="space-y-1.5 text-sm text-white/70">
          Phone
          <input
            value={fields.phone}
            onChange={(event) => setField("phone", event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white"
          />
        </label>
        <label className="space-y-1.5 text-sm text-white/70">
          Email
          <input
            type="email"
            value={fields.email}
            onChange={(event) => setField("email", event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white"
          />
        </label>
        <label className="space-y-1.5 text-sm text-white/70">
          Opening hours
          <input
            value={fields.openingHours}
            onChange={(event) => setField("openingHours", event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white"
          />
        </label>
        <label className="space-y-1.5 text-sm text-white/70">
          Currency
          <input
            maxLength={10}
            value={fields.currency}
            onChange={(event) => setField("currency", event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white"
          />
        </label>
        <label className="space-y-1.5 text-sm text-white/70 sm:col-span-2">
          Address
          <textarea
            rows={2}
            value={fields.address}
            onChange={(event) => setField("address", event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white"
          />
        </label>
      </div>
      <div className="grid gap-4 border-b border-white/10 pb-5 sm:grid-cols-2">
        {(["instagram", "facebook", "twitter", "website"] as const).map(
          (network) => (
            <label
              key={network}
              className="space-y-1.5 text-sm capitalize text-white/70"
            >
              {network}
              <input
                type="url"
                value={fields.socialLinks[network]}
                onChange={(event) => setSocialLink(network, event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white"
              />
            </label>
          ),
        )}
      </div>
      <div className="flex flex-wrap gap-6 border-y border-white/10 py-4">
        <label className="flex items-center gap-2 text-sm text-white/75">
          <input
            type="checkbox"
            checked={fields.isOpen}
            onChange={(event) => setField("isOpen", event.target.checked)}
          />
          Open for orders
        </label>
        <label className="flex items-center gap-2 text-sm text-white/75">
          <input
            type="checkbox"
            checked={fields.isActive}
            onChange={(event) => setField("isActive", event.target.checked)}
          />
          Platform active
        </label>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save restaurant"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/super-admin")}
          className="rounded-md border border-white/15 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
