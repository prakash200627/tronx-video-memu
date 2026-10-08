"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  Restaurant,
  RestaurantTheme,
  FeatureKey,
} from "@/types";
import { DEFAULT_PLAN, PLAN_ENTITLEMENTS, hasRestaurantFeature } from "@/lib/features";

const featureKeys: FeatureKey[] = ["VIDEO_MENU", "TABLE_MANAGEMENT", "TABLE_ORDERING", "ORDER_MANAGEMENT", "MEDIA_LIBRARY", "RESERVATIONS", "CAPTAIN_ACCESS", "WIFI", "CUSTOM_THEME", "ANALYTICS"];

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
  subscriptionEnabled: boolean;
  subscriptionPlan: Restaurant["subscriptionPlan"];
  featureOverrides: Partial<Record<FeatureKey, boolean>>;
  theme: RestaurantTheme;
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
  subscriptionEnabled: true,
  subscriptionPlan: DEFAULT_PLAN,
  featureOverrides: {},
  theme: {
    primaryColor: "#602e31",
    secondaryColor: "#2d1719",
    accentColor: "#602e31",
    backgroundColor: "#ffffff",
    textColor: "#241416",
    buttonStyle: "filled",
    borderRadius: "rounded",
  },
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
          subscriptionEnabled: restaurant.subscriptionEnabled !== false,
          subscriptionPlan: restaurant.subscriptionPlan ?? DEFAULT_PLAN,
          featureOverrides: { ...restaurant.featureOverrides },
          theme: {
            primaryColor: restaurant.theme?.primaryColor ?? "#602e31",
            secondaryColor: restaurant.theme?.secondaryColor ?? "#2d1719",
            accentColor: restaurant.theme?.accentColor ?? "#602e31",
            backgroundColor: restaurant.theme?.backgroundColor ?? "#ffffff",
            textColor: restaurant.theme?.textColor ?? "#241416",
            buttonStyle: restaurant.theme?.buttonStyle ?? "filled",
            borderRadius: restaurant.theme?.borderRadius ?? "rounded",
          },
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

  const setThemeField = (
    key: keyof RestaurantTheme,
    value: string,
  ) =>
    setFields((current) => ({
      ...current,
      theme: { ...current.theme, [key]: value },
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
      router.refresh();
      if (!restaurant) router.push("/super-admin");
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
      <div className="space-y-4 border-b border-white/10 pb-5">
        <h2 className="text-lg font-semibold">Subscription & Features</h2>
        <label className="flex items-center gap-2 text-sm text-white/75">
          <input type="checkbox" checked={fields.subscriptionEnabled} onChange={(event) => setField("subscriptionEnabled", event.target.checked)} />
          Subscription {fields.subscriptionEnabled ? "ON" : "OFF"}
        </label>
        <div className="space-y-2">
          <p className="text-sm font-medium text-white/70">Feature Overrides</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {featureKeys.map((feature) => (
              <div key={feature} className="rounded-lg border border-white/10 p-3 text-sm text-white/75">
                {(() => {
                  const effective = hasRestaurantFeature(fields, feature);
                  const override = fields.featureOverrides[feature];
                  const planAccess = PLAN_ENTITLEMENTS[fields.subscriptionPlan ?? DEFAULT_PLAN].includes(feature);
                  const configuredAccess = override ?? planAccess;
                  return <>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{feature.replace(/_/g, " ").toLowerCase()}</p>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={configuredAccess}
                        aria-label={`${feature.replace(/_/g, " ")} feature setting`}
                        onClick={() => setFields((current) => ({
                          ...current,
                          featureOverrides: { ...current.featureOverrides, [feature]: !configuredAccess },
                        }))}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${configuredAccess ? "bg-emerald-500" : "bg-zinc-700"}`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${configuredAccess ? "translate-x-6" : "translate-x-1"}`} />
                        <span className="sr-only">{configuredAccess ? "ON" : "OFF"}</span>
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/50">
                      <span>Effective access: <strong className={effective ? "text-emerald-300" : "text-white/70"}>{effective ? "ON" : "OFF"}</strong></span>
                      <span>{override === true ? "Explicit override: ON" : override === false ? "Explicit override: OFF" : `Use plan default (${planAccess ? "ON" : "OFF"})`}</span>
                    </div>
                    {override !== undefined && <button
                      type="button"
                      onClick={() => setFields((current) => {
                        const featureOverrides = { ...current.featureOverrides };
                        delete featureOverrides[feature];
                        return { ...current, featureOverrides };
                      })}
                      className="mt-2 text-[11px] font-medium text-sky-300 underline underline-offset-2 hover:text-sky-200"
                    >Use plan default</button>}
                  </>;
                })()}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4 border-b border-white/10 pb-5">
        <h2 className="text-lg font-semibold">Theme &amp; Branding</h2>
        <p className="text-xs text-white/50">
          Custom theme is applied when the subscription is ON and CUSTOM_THEME is ON. Otherwise the default TRONX theme is used.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["primaryColor", "Primary Color", "#602e31"],
              ["secondaryColor", "Secondary Color", "#2d1719"],
              ["accentColor", "Accent Color", "#602e31"],
              ["backgroundColor", "Background Color", "#ffffff"],
              ["textColor", "Text Color", "#241416"],
            ] as const
          ).map(([key, label, placeholder]) => (
            <label key={key} className="space-y-1.5 text-sm text-white/70">
              {label}
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fields.theme[key] && /^#[0-9A-Fa-f]{6}$/.test(fields.theme[key]!) ? fields.theme[key]! : placeholder}
                  onChange={(event) => setThemeField(key, event.target.value)}
                  className="h-9 w-9 rounded-lg border border-white/10 bg-transparent p-0.5 cursor-pointer"
                />
                <input
                  type="text"
                  maxLength={7}
                  pattern="#[0-9A-Fa-f]{6}"
                  title="Enter a 6-digit hex color such as #602e31"
                  value={fields.theme[key] || ""}
                  onChange={(event) => setThemeField(key, event.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white font-mono text-xs"
                />
              </div>
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm text-white/70">
            Button Style
            <select
              value={fields.theme.buttonStyle || "filled"}
              onChange={(event) =>
                setThemeField("buttonStyle", event.target.value)
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white"
            >
              <option value="filled">Filled</option>
              <option value="outlined">Outlined</option>
              <option value="gradient">Gradient</option>
            </select>
          </label>
          <label className="space-y-1.5 text-sm text-white/70">
            Border Radius
            <select
              value={fields.theme.borderRadius || "rounded"}
              onChange={(event) =>
                setThemeField("borderRadius", event.target.value)
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white"
            >
              <option value="sharp">Sharp (0px)</option>
              <option value="rounded">Rounded (12px)</option>
              <option value="pill">Pill (Full)</option>
            </select>
          </label>
        </div>
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
