"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { OrderSummary } from "@/types";
import { RefreshCw } from "lucide-react";

const nextAction: Partial<Record<OrderSummary["status"], { status: OrderSummary["status"]; label: string }>> = {
  PENDING: { status: "ACCEPTED", label: "Accept" },
  ACCEPTED: { status: "PREPARING", label: "Start preparing" },
  PREPARING: { status: "READY", label: "Mark ready" },
  READY: { status: "SERVED", label: "Mark served" },
};
const statusTitle: Record<OrderSummary["status"], string> = {
  PENDING: "New", ACCEPTED: "Accepted", PREPARING: "Preparing", READY: "Ready", SERVED: "Served", CANCELLED: "Cancelled",
};
const formatOrderTime = (iso: string) => `${iso.replace("T", " ").slice(0, 16)} UTC`;

export default function OrdersManager({ initialOrders }: { initialOrders: OrderSummary[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try { setOrders(await api.getOrders()); setMessage(""); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to refresh orders."); }
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  const setStatus = async (order: OrderSummary, status: OrderSummary["status"]) => {
    setBusyId(order.id); setMessage("");
    try {
      const updated = await api.updateOrderStatus(order.id, status);
      setOrders((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update order."); }
    finally { setBusyId(null); }
  };
  const groups: OrderSummary["status"][] = ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED", "CANCELLED"];
  return <div className="space-y-6">
    <header className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-white sm:text-3xl">Orders</h1><p className="mt-1 text-sm text-white/55">New orders refresh automatically every 15 seconds.</p></div><button type="button" onClick={() => void refresh()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 px-3 text-sm text-white/80 hover:bg-white/10"><RefreshCw className="h-4 w-4" />Refresh</button></header>
    {message && <p role="alert" className="text-sm text-rose-300">{message}</p>}
    {groups.map((status) => {
      const list = orders.filter((order) => order.status === status);
      if (!list.length) return null;
      return <section key={status} className="space-y-3"><h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white/55">{statusTitle[status]} <span className="text-white/30">{list.length}</span></h2>
        {list.map((order) => {
          const action = nextAction[order.status];
          return <article id={`order-${order.id}`} key={order.id} className="scroll-mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-white">#{order.orderNumber} <span className="ml-1 text-sm font-medium text-white/60">· Table {order.tableNumber}</span></h3><p className="mt-1 text-xs text-white/40">{formatOrderTime(order.createdAt)}</p></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">{statusTitle[status]}</span></div>
            <ul className="mt-4 space-y-3">{order.items.map((item, index) => <li key={`${item.dishId}-${index}`} className="flex items-start justify-between gap-3 border-t border-white/8 pt-3 text-sm"><div><p className="font-semibold text-white/90">{item.dishNameSnapshot} × {item.quantity}</p>{item.addons.map((addon) => <p key={addon.addonId} className="mt-0.5 text-xs text-white/45">{addon.nameSnapshot}{addon.quantity > 1 ? ` × ${addon.quantity}` : ""}</p>)}</div><span className="shrink-0 text-white/65">₹{item.itemTotal}</span></li>)}</ul>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4"><p className="font-mono text-lg font-bold text-white">Total ₹{order.total}</p><div className="flex gap-2">{(status === "PENDING" || status === "ACCEPTED") && <button disabled={busyId === order.id} onClick={() => void setStatus(order, "CANCELLED")} className="h-10 rounded-xl border border-rose-400/30 px-4 text-sm font-semibold text-rose-200 disabled:opacity-50">Cancel</button>}{action && <button disabled={busyId === order.id} onClick={() => void setStatus(order, action.status)} className="h-10 rounded-xl bg-white px-4 text-sm font-bold text-black disabled:opacity-50">{action.label}</button>}</div></div>
          </article>;
        })}
      </section>;
    })}
    {orders.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/45">No orders yet.</p>}
  </div>;
}
