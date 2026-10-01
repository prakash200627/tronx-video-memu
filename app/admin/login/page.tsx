"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const next = searchParams.get("next") || "/admin";
  const requestedRestaurant = next.startsWith("/admin/")
    ? next.replace("/admin/", "").split("/")[0]
    : "";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role: "RESTAURANT_ADMIN",
          restaurantSlug: requestedRestaurant || undefined,
        }),
      });
      const result = (await response.json()) as {
        success: boolean;
        error?: string;
        data?: { restaurantSlug?: string };
      };

      if (!result.success) {
        throw new Error(result.error || "Login failed");
      }

      const restaurantSlug = result.data?.restaurantSlug;
      const safeNext =
        restaurantSlug && next.startsWith(`/admin/${restaurantSlug}`)
          ? next
          : restaurantSlug
            ? `/admin/${restaurantSlug}`
            : "/admin/login";
      window.location.assign(safeNext);
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Login failed",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-white/2 p-6 shadow-2xl"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
            TRONX ADMIN
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-white/50">
            Access the restaurant management console.
          </p>
        </div>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}

        <label className="block text-sm text-white/70">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-white/30"
          />
        </label>

        <label className="block text-sm text-white/70">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-white/30"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black transition hover:bg-white/90 disabled:opacity-50"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
          Loading…
        </main>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
