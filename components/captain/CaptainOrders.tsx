"use client";

import { useCallback, useEffect, useState } from "react";
import type { OrderSummary } from "@/types";
import { RefreshCw } from "lucide-react";

const nextAction: Partial<Record<OrderSummary["status"], { status: OrderSummary["status"]; label: string }>> = {
  PENDING: { status: "ACCEPTED", label: "Accept" },
  ACCEPTED: { status: "PREPARING", label: "Start preparing" },
  PREPARING: { status: "READY", label: "Mark ready" },
  READY: { status: "SERVED", label: "Mark served" },
};
const title: Record<OrderSummary["status"], string> = { PENDING: "New", ACCEPTED: "Accepted", PREPARING: "Preparing", READY: "Ready", SERVED: "Served", CANCELLED: "Cancelled" };

async function captainRequest<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const result = await response.json() as { success: boolean; data?: T; error?: string };
  if (!response.ok || !result.success) throw new Error(result.error ?? "Request failed");
  return result.data as T;
}

export default function CaptainOrders({ initialOrders }: { initialOrders: OrderSummary[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const refresh = useCallback(async () => { try { setOrders(await captainRequest<OrderSummary[]>("/api/captain/orders")); setMessage(""); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to refresh orders"); } }, []);
  useEffect(() => { const timer = window.setInterval(() => void refresh(), 15000); return () => window.clearInterval(timer); }, [refresh]);
  const setStatus = async (order: OrderSummary, status: OrderSummary["status"]) => {
    setBusyId(order.id); setMessage("");
    try { const updated = await captainRequest<OrderSummary>(`/api/captain/orders/${order.id}`, { method: "PATCH", body: JSON.stringify({ status }) }); setOrders((current) => current.map((entry) => entry.id === updated.id ? updated : entry)); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update order"); }
    finally { setBusyId(null); }
  };
  const groups: OrderSummary["status"][] = ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED", "CANCELLED"];
  return <div className="space-y-6"><header className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold sm:text-3xl">Orders</h1><p className="mt-1 text-sm text-white/55">Orders refresh automatically every 15 seconds.</p></div><button onClick={() => void refresh()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-3 text-sm text-white/80"><RefreshCw className="h-4 w-4" />Refresh</button></header>
    {message && <p role="alert" className="text-sm text-rose-300">{message}</p>}
    {groups.map((status) => { const list = orders.filter((order) => order.status === status); if (!list.length) return null; return <section key={status} className="space-y-3"><h2 className="text-sm font-bold uppercase tracking-wider text-white/55">{title[status]} · {list.length}</h2>{list.map((order) => { const action = nextAction[status]; return <article key={order.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="text-lg font-bold">#{order.orderNumber} <span className="ml-1 text-sm font-medium text-white/60">· Table {order.tableNumber}</span></h3><p className="mt-1 text-xs text-white/40">{order.createdAt.replace("T", " ").slice(0, 16)} UTC</p></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">{title[status]}</span></div>
      <ul className="mt-4 space-y-3">{order.items.map((item, index) => <li key={`${item.dishId}-${index}`} className="flex justify-between gap-3 border-t border-white/8 pt-3 text-sm"><div><p className="font-semibold">{item.dishNameSnapshot} × {item.quantity}</p>{item.addons.map((addon) => <p key={addon.addonId} className="mt-0.5 text-xs text-white/45">{addon.nameSnapshot}</p>)}</div><span>₹{item.itemTotal}</span></li>)}</ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4"><p className="text-lg font-bold">Total ₹{order.total}</p><div className="flex gap-2">{(status === "PENDING" || status === "ACCEPTED") && <button disabled={busyId === order.id} onClick={() => void setStatus(order, "CANCELLED")} className="h-10 rounded-xl border border-rose-400/30 px-4 text-sm text-rose-200 disabled:opacity-50">Cancel</button>}{action && <button disabled={busyId === order.id} onClick={() => void setStatus(order, action.status)} className="h-10 rounded-xl bg-white px-4 text-sm font-bold text-black disabled:opacity-50">{action.label}</button>}</div></div>
      </article>; })}</section>; })}
    {orders.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/45">No orders yet.</p>}
  </div>;
}
