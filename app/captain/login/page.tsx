"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function CaptainLoginForm() {
  const params = useSearchParams();
  const [restaurantSlug, setRestaurantSlug] = useState(params.get("restaurant") ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/captain/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restaurantSlug, email, password }) });
      const result = await response.json() as { success: boolean; error?: string; data?: { restaurantSlug: string } };
      if (!response.ok || !result.success || !result.data) throw new Error(result.error ?? "Unable to sign in");
      const next = params.get("next") ?? "";
      window.location.assign(next.startsWith(`/captain/${result.data.restaurantSlug}`) ? next : `/captain/${result.data.restaurantSlug}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to sign in"); setBusy(false); }
  };
  return <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white"><form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6">
    <div><p className="text-xs font-semibold uppercase tracking-wider text-white/40">TRONX CAPTAIN</p><h1 className="mt-2 text-2xl font-bold">Sign in</h1><p className="mt-1 text-sm text-white/50">Access your restaurant’s tables and orders.</p></div>
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
    <label className="block text-sm text-white/70">Restaurant slug<input value={restaurantSlug} onChange={(e) => setRestaurantSlug(e.target.value)} autoComplete="organization" required className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white" /></label>
    <label className="block text-sm text-white/70">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white" /></label>
    <label className="block text-sm text-white/70">Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white" /></label>
    <button disabled={busy} className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button>
  </form></main>;
}

export default function CaptainLoginPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-black text-white">Loading…</main>}><CaptainLoginForm /></Suspense>;
}
