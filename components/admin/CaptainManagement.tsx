"use client";

import { useEffect, useState } from "react";
import type { CaptainView } from "@/types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const result = await response.json() as { success: boolean; data?: T; error?: string };
  if (!response.ok || !result.success) throw new Error(result.error ?? "Request failed");
  return result.data as T;
}

export default function CaptainManagement() {
  const [captains, setCaptains] = useState<CaptainView[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = async () => setCaptains(await request<CaptainView[]>("/api/admin/captains"));
  useEffect(() => {
    let mounted = true;
    request<CaptainView[]>("/api/admin/captains")
      .then((data) => { if (mounted) setCaptains(data); })
      .catch((error: unknown) => { if (mounted) setMessage(error instanceof Error ? error.message : "Unable to load Captains"); });
    return () => { mounted = false; };
  }, []);

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await request<CaptainView>("/api/admin/captains", { method: "POST", body: JSON.stringify({ name, email, password }) });
      setName(""); setEmail(""); setPassword(""); await refresh(); setMessage("Captain created.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create Captain"); }
    finally { setBusy(false); }
  };

  const toggle = async (captain: CaptainView) => {
    setMessage("");
    try { await request(`/api/admin/captains/${captain.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !captain.isActive }) }); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update Captain"); }
  };

  const resetPassword = async (captain: CaptainView) => {
    const nextPassword = window.prompt(`Enter a new password for ${captain.name} (at least 8 characters):`);
    if (!nextPassword) return;
    try { await request(`/api/admin/captains/${captain.id}/password`, { method: "POST", body: JSON.stringify({ password: nextPassword }) }); setMessage("Captain password updated."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to reset password"); }
  };

  return <div className="space-y-6">
    <header><h1 className="text-2xl font-bold text-white sm:text-3xl">Captain Access</h1><p className="mt-1 text-sm text-white/55">Create and manage staff accounts for your restaurant.</p></header>
    {message && <p role="status" className="text-sm text-white/70">{message}</p>}
    <form onSubmit={create} className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
      <input aria-label="Name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm" />
      <input aria-label="Email" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm" />
      <input aria-label="Temporary password" placeholder="Temporary password (8+ characters)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm" />
      <button disabled={busy} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50">Create Captain</button>
    </form>
    <section className="space-y-3">
      {captains.map((captain) => <article key={captain.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div><h2 className="font-semibold text-white">{captain.name}</h2><p className="text-sm text-white/50">{captain.email} · {captain.isActive ? "Enabled" : "Disabled"}</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => void resetPassword(captain)} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80">Reset password</button><button type="button" onClick={() => void toggle(captain)} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80">{captain.isActive ? "Disable" : "Enable"}</button></div>
      </article>)}
      {captains.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/45">No Captains added yet.</p>}
    </section>
  </div>;
}
