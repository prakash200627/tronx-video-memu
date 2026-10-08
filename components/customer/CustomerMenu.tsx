"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dish, RestaurantMenu } from "@/types";
import type { TableStatus } from "@/types";
import CategoryNav from "@/components/customer/CategoryNav";
import MenuSection from "@/components/customer/MenuSection";
import RestaurantHero from "@/components/customer/RestaurantHero";
import DishDetailModal from "@/components/customer/DishDetailModal";
import { api } from "@/lib/api";
import { Minus, Plus, ShoppingBag, Wifi, X } from "lucide-react";
import type { OrderSummary } from "@/types";
import ReservationPanel from "@/components/customer/ReservationPanel";
import WifiAccessPanel from "@/components/customer/WifiAccessPanel";

type CartSelection = { groupId: string; addonIds: string[] };
type CartLine = { key: string; dishId: string; quantity: number; selections: CartSelection[] };
type CustomerOrderReceipt = Pick<OrderSummary, "id" | "orderNumber" | "tableNumber" | "total" | "status"> & Partial<Pick<OrderSummary, "items" | "subtotal" | "createdAt" | "updatedAt">> & { token: string; restaurantId?: string; restaurantSlug?: string; tableId?: string; customerSessionId?: string };

const orderStatusMessage: Record<OrderSummary["status"], string> = {
  PENDING: "Order received — waiting for restaurant confirmation",
  ACCEPTED: "The restaurant accepted your order",
  PREPARING: "Your food is being prepared",
  READY: "Your order is ready",
  SERVED: "Order completed",
  CANCELLED: "This order was cancelled. Please speak with restaurant staff.",
};

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Partial<CartLine>;
  return typeof line.key === "string" && typeof line.dishId === "string" && typeof line.quantity === "number" && Number.isInteger(line.quantity) && line.quantity > 0 && Array.isArray(line.selections) && line.selections.every((selection) => Boolean(selection && typeof selection.groupId === "string" && Array.isArray(selection.addonIds) && selection.addonIds.every((id) => typeof id === "string")));
}

function isCustomerOrderReceipt(value: unknown): value is CustomerOrderReceipt {
  if (!value || typeof value !== "object") return false;
  const receipt = value as Partial<CustomerOrderReceipt>;
  return typeof receipt.id === "string" && typeof receipt.token === "string" && typeof receipt.orderNumber === "number" && typeof receipt.tableNumber === "number" && typeof receipt.total === "number" && Boolean(receipt.status && receipt.status in orderStatusMessage);
}

function parseCustomerOrderReceipts(value: unknown): CustomerOrderReceipt[] {
  const candidates = Array.isArray(value) ? value : value ? [value] : [];
  return candidates.filter(isCustomerOrderReceipt);
}

function readStoredCustomerOrders(value: string | null): CustomerOrderReceipt[] {
  if (!value) return [];
  try { return parseCustomerOrderReceipts(JSON.parse(value)); }
  catch { return []; }
}

type CustomerMenuProps = {
  initialMenu: RestaurantMenu;
  restaurantIdOrSlug: string;
  tableNumber: number | null;
  tableId: string | null;
  tableStatus: TableStatus | null;
  invalidTable: boolean;
  reservationsEnabled?: boolean;
  initialReservationView?: boolean;
  wifiEnabled?: boolean;
  videoMenuEnabled?: boolean;
  tableOrderingEnabled?: boolean;
};

export default function CustomerMenu({
  initialMenu,
  restaurantIdOrSlug,
  tableNumber,
  tableId,
  tableStatus,
  invalidTable,
  reservationsEnabled = false,
  initialReservationView = false,
  wifiEnabled = false,
  videoMenuEnabled = true,
  tableOrderingEnabled = true,
}: CustomerMenuProps) {
  const [reservationOpen, setReservationOpen] = useState(initialReservationView);
  const [wifiOpen, setWifiOpen] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{
    restaurantIdOrSlug: string;
    menu: RestaurantMenu;
  } | null>(null);
  const menu =
    refreshResult?.restaurantIdOrSlug === restaurantIdOrSlug
      ? refreshResult.menu
      : initialMenu;

  const activeCategories = menu.categories
    .filter((category) => category.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const [activeCategory, setActiveCategory] = useState(
    () => activeCategories[0]?.id ?? "",
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [vegetarianOnly, setVegetarianOnly] = useState(false);
  const filteredDishes = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return menu.dishes.filter((dish) => {
      const matchesQuery = !query || [dish.name, dish.description]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase().includes(query));
      return matchesQuery && (!vegetarianOnly || dish.isVeg);
    });
  }, [menu.dishes, searchQuery, vegetarianOnly]);
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const selectedDish =
    menu.dishes.find((dish) => dish.id === selectedDishId) ?? null;

  const isManualScrolling = useRef(false);
  const manualScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const submitInFlight = useRef(false);
  const idempotencyRef = useRef<string | null>(null);
  const cartKey = `tronx-cart:${menu.restaurant.id}:${tableId ?? "no-table"}`;
  const orderKey = `${cartKey}:orders`;
  const legacyOrderKey = `${cartKey}:active-order`;
  const canOrder = Boolean(tableOrderingEnabled && tableNumber && !invalidTable && tableStatus !== "CLOSED");
  const tableResolved = Boolean(tableNumber && tableId && !invalidTable);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [loadedCartKey, setLoadedCartKey] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [customerOrders, setCustomerOrders] = useState<CustomerOrderReceipt[]>([]);
  const [unpollableOrderIds, setUnpollableOrderIds] = useState<string[]>([]);
  const [customerSessionId, setCustomerSessionId] = useState<string | null>(null);

  useEffect(() => {
    const hydrate = () => {
      let currentSessionId = crypto.randomUUID();
      try {
        const savedCart = localStorage.getItem(cartKey);
        const parsedCart: unknown = savedCart ? JSON.parse(savedCart) : [];
        setCart(Array.isArray(parsedCart) ? parsedCart.filter(isCartLine) : []);
        const savedOrder = localStorage.getItem(orderKey);
        const savedLegacyOrder = localStorage.getItem(legacyOrderKey);
        const allSavedOrders = [...readStoredCustomerOrders(savedOrder), ...readStoredCustomerOrders(savedLegacyOrder)];
        const parsedOrders = [...new Map(allSavedOrders.map((order) => [order.id, order])).values()];
        const customerSessionStorageKey = `${cartKey}:customer-session`;
        try {
          currentSessionId = sessionStorage.getItem(customerSessionStorageKey) ?? currentSessionId;
          sessionStorage.setItem(customerSessionStorageKey, currentSessionId);
        } catch { /* A per-tab session still works when sessionStorage is disabled. */ }
        setCustomerSessionId(currentSessionId);
        const storedOrders = parsedOrders.map((order) => ({
          ...order,
          restaurantId: order.restaurantId ?? menu.restaurant.id,
          restaurantSlug: order.restaurantSlug ?? menu.restaurant.slug,
          tableId: order.tableId ?? tableId ?? undefined,
          customerSessionId: order.customerSessionId ?? currentSessionId,
        }));
        if (savedOrder || savedLegacyOrder) {
          localStorage.setItem(orderKey, JSON.stringify(storedOrders));
          localStorage.removeItem(legacyOrderKey);
        }
        setCustomerOrders(storedOrders.filter((order) => order.customerSessionId === currentSessionId));
        setUnpollableOrderIds([]);
        const savedKey = sessionStorage.getItem(`${cartKey}:submit-key`);
        idempotencyRef.current = savedKey;
        setLoadedCartKey(cartKey);
        setCartOpen(false);
      } catch {
        setCart([]);
        setCustomerOrders([]);
        setUnpollableOrderIds([]);
        setCustomerSessionId(currentSessionId);
        idempotencyRef.current = null;
        setLoadedCartKey(cartKey);
        setCartOpen(false);
      } finally { setCartReady(true); }
    };
    window.setTimeout(hydrate, 0);
  }, [cartKey, legacyOrderKey, menu.restaurant.id, menu.restaurant.slug, orderKey, tableId]);

  useEffect(() => {
    if (loadedCartKey !== cartKey || !customerSessionId) return;
    try {
      const existingOrders = parseCustomerOrderReceipts(JSON.parse(localStorage.getItem(orderKey) ?? "null"));
      const mergedOrders = [...existingOrders.filter((order) => order.customerSessionId !== customerSessionId), ...customerOrders];
      if (mergedOrders.length) localStorage.setItem(orderKey, JSON.stringify(mergedOrders));
      else localStorage.removeItem(orderKey);
    } catch { /* Keep customer order history available in component state if storage is unavailable. */ }
  }, [cartKey, customerOrders, customerSessionId, loadedCartKey, orderKey]);

  useEffect(() => {
    const syncOrders = (event: StorageEvent) => {
      if (event.key !== orderKey) return;
      try {
        const orders = parseCustomerOrderReceipts(event.newValue ? JSON.parse(event.newValue) : null);
        const currentSessionOrders = orders.filter((order) => order.customerSessionId === customerSessionId);
        setCustomerOrders((current) => JSON.stringify(current) === JSON.stringify(currentSessionOrders) ? current : currentSessionOrders);
        setUnpollableOrderIds([]);
      }
      catch { setCustomerOrders([]); }
    };
    window.addEventListener("storage", syncOrders);
    return () => window.removeEventListener("storage", syncOrders);
  }, [customerSessionId, orderKey]);

  useEffect(() => {
    if (!cartReady || loadedCartKey !== cartKey) return;
    try {
      if (cart.length) localStorage.setItem(cartKey, JSON.stringify(cart));
      else localStorage.removeItem(cartKey);
    } catch { /* Ordering remains usable if browser storage is unavailable. */ }
  }, [cart, cartKey, cartReady, loadedCartKey]);

  const priceForLine = (line: CartLine) => {
    const dish = menu.dishes.find((entry) => entry.id === line.dishId);
    if (!dish) return 0;
    const addonTotal = line.selections.flatMap((selection) => {
      const group = dish.addonGroups?.find((entry) => entry.id === selection.groupId);
      return selection.addonIds.map((addonId) => group?.addons.find((addon) => addon.id === addonId)?.price ?? 0);
    }).reduce((sum, price) => sum + price, 0);
    return (dish.price + addonTotal) * line.quantity;
  };
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cart.reduce((sum, line) => sum + priceForLine(line), 0);
  const customerOrdersTotal = customerOrders.reduce((sum, order) => sum + order.total, 0);

  const addToCart = (entry: { dishId: string; quantity: number; selections: CartSelection[] }) => {
    const canonicalSelections = [...entry.selections].map((selection) => ({ ...selection, addonIds: [...selection.addonIds].sort() })).sort((a, b) => a.groupId.localeCompare(b.groupId));
    const key = `${entry.dishId}:${JSON.stringify(canonicalSelections)}`;
    setCart((current) => {
      const existing = current.find((line) => line.key === key);
      return existing
        ? current.map((line) => line.key === key ? { ...line, quantity: Math.min(99, line.quantity + entry.quantity) } : line)
        : [...current, { key, dishId: entry.dishId, quantity: entry.quantity, selections: canonicalSelections }];
    });
    setOrderError("");
  };

  const changeQuantity = (key: string, delta: number) => setCart((current) => current.map((line) => line.key === key ? { ...line, quantity: line.quantity + delta } : line).filter((line) => line.quantity > 0 && line.quantity <= 99));

  const placeOrder = async () => {
    if (!canOrder || !customerSessionId || !cart.length || submitting || submitInFlight.current) return;
    submitInFlight.current = true;
    setSubmitting(true); setOrderError("");
    try {
      const key = idempotencyRef.current ?? crypto.randomUUID();
      idempotencyRef.current = key;
      try { sessionStorage.setItem(`${cartKey}:submit-key`, key); } catch { /* The in-memory key still prevents repeat taps in this session. */ }
      const response = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: menu.restaurant.slug,
          tableNumber,
          idempotencyKey: key,
          items: cart.map((line) => {
            const dish = menu.dishes.find((entry) => entry.id === line.dishId)!;
            return {
              dishId: dish.id,
              quantity: line.quantity,
              expectedUnitPrice: dish.price,
              selections: line.selections.map((selection) => ({
                groupId: selection.groupId,
                addons: selection.addonIds.map((addonId) => ({
                  addonId,
                  expectedUnitPrice: dish.addonGroups?.find((group) => group.id === selection.groupId)?.addons.find((addon) => addon.id === addonId)?.price ?? -1,
                })),
              })),
            };
          }),
        }),
      });
      const result = await response.json() as { success: boolean; error?: string; data?: { order: OrderSummary; customerToken: string } };
      if (!response.ok || !result.success || !result.data) throw new Error(result.error || "Unable to place your order.");
      const receipt: CustomerOrderReceipt = {
        ...result.data.order,
        token: result.data.customerToken,
        restaurantId: menu.restaurant.id,
        restaurantSlug: menu.restaurant.slug,
        tableId: tableId ?? undefined,
        customerSessionId,
      };
      try { sessionStorage.removeItem(`${cartKey}:submit-key`); } catch { /* Ignore unavailable session storage. */ }
      idempotencyRef.current = null;
      setCustomerOrders((current) => [...current.filter((order) => order.id !== receipt.id), receipt]);
      setCart([]); setCartOpen(false);
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : "Unable to place your order.");
    } finally { submitInFlight.current = false; setSubmitting(false); }
  };

  const pollableOrders = useMemo(() => customerOrders.filter((order) =>
    order.status !== "SERVED" && order.status !== "CANCELLED" && !unpollableOrderIds.includes(order.id),
  ), [customerOrders, unpollableOrderIds]);

  useEffect(() => {
    if (!pollableOrders.length || loadedCartKey !== cartKey) return;
    let alive = true;
    const refreshStatus = async () => {
      const results = await Promise.all(pollableOrders.map(async (order) => {
        try {
          const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}/status`, { cache: "no-store", headers: { Authorization: `Bearer ${order.token}` } });
          if (response.status === 401 || response.status === 403 || response.status === 404) return { id: order.id, rejected: true as const };
          const result = await response.json() as { success: boolean; data?: OrderSummary };
          return result.success && result.data ? { id: order.id, rejected: false as const, order: result.data } : null;
        } catch { return null; }
      }));
      if (!alive) return;
      const updates = results.filter((result): result is NonNullable<typeof result> => result !== null);
      const rejectedIds = updates.filter((result) => result.rejected).map((result) => result.id);
      if (rejectedIds.length) setUnpollableOrderIds((current) => [...new Set([...current, ...rejectedIds])]);
      const validUpdates = updates.filter((result): result is Extract<typeof result, { rejected: false }> => !result.rejected);
      if (validUpdates.length) {
        setCustomerOrders((current) => {
          let changed = false;
          const next = current.map((order) => {
            const result = validUpdates.find((entry) => entry.id === order.id)?.order;
            if (!result || (order.status === result.status && order.updatedAt === result.updatedAt)) return order;
            changed = true;
            return { ...order, ...result, token: order.token };
          });
          return changed ? next : current;
        });
      }
    };
    void refreshStatus();
    const timer = window.setInterval(() => void refreshStatus(), 8000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [cartKey, loadedCartKey, pollableOrders]);

  const refreshMenu = useCallback(async () => {
    try {
      const next = await api.getPublicMenu(restaurantIdOrSlug);
      setRefreshResult({ restaurantIdOrSlug, menu: next });
    } catch {
      return;
    }
  }, [restaurantIdOrSlug]);

  useEffect(() => {
    const onFocus = () => {
      void refreshMenu();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshMenu]);

  const handleCategorySelect = (categoryId: string) => {
    isManualScrolling.current = true;
    setActiveCategory(categoryId === "all" ? "" : categoryId);

    if (manualScrollTimeout.current) {
      clearTimeout(manualScrollTimeout.current);
    }

    manualScrollTimeout.current = setTimeout(() => {
      isManualScrolling.current = false;
    }, 750);
  };

  useEffect(() => {
    if (activeCategories.length === 0) return;

    const observerCallback: IntersectionObserverCallback = () => {
      if (isManualScrolling.current) return;

      if (window.scrollY < 100) {
        const firstId = activeCategories[0].id;
        setActiveCategory((prev) => (prev === firstId ? prev : firstId));
        return;
      }

      const current = activeCategories.find((cat) => {
        const el = document.getElementById(`category-${cat.id}`);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top <= 120 && rect.bottom > 100;
      });

      if (current) {
        setActiveCategory((prev) => (prev === current.id ? prev : current.id));
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "-60px 0px -40% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1.0],
    });

    activeCategories.forEach((cat) => {
      const element = document.getElementById(`category-${cat.id}`);
      if (element) {
        observer.observe(element);
      }
    });

    const handleScroll = () => {
      if (isManualScrolling.current) return;
      const isAtBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 40;

      if (isAtBottom && activeCategories.length > 0) {
        const lastCategoryId = activeCategories[activeCategories.length - 1].id;
        setActiveCategory((prev) =>
          prev === lastCategoryId ? prev : lastCategoryId,
        );
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      if (manualScrollTimeout.current) {
        clearTimeout(manualScrollTimeout.current);
      }
    };
  }, [activeCategories]);

  return (
    <main className="customer-menu min-h-screen bg-[var(--restaurant-background)] pb-24 text-[var(--restaurant-text)] selection:bg-[var(--restaurant-primary)]/20">
      {(reservationsEnabled || wifiEnabled) && <div className="mx-auto flex max-w-7xl justify-end gap-2 px-4 pt-4 sm:px-6 lg:px-8">{wifiEnabled && <button type="button" onClick={() => setWifiOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-[#ead9cf] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--restaurant-primary)] shadow-sm hover:border-[var(--restaurant-primary)]"><Wifi className="h-4 w-4" />Wi-Fi</button>}{reservationsEnabled && <button type="button" onClick={() => setReservationOpen(true)} className="rounded-xl border border-[#ead9cf] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--restaurant-primary)] shadow-sm hover:border-[var(--restaurant-primary)]">Reserve a Table</button>}</div>}
      <RestaurantHero restaurant={menu.restaurant} />

      {tableResolved ? (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center rounded-full border border-[#ead9cf] bg-white/75 px-3 py-1.5 text-xs font-semibold text-[#695352]">Table {tableNumber}</span>
        </div>
      ) : invalidTable ? (
        <div role="alert" className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8"><p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">This table link is invalid or inactive. You can browse the menu, but ordering is disabled. Please ask restaurant staff for a current QR code.</p></div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">{tableOrderingEnabled && <p className="text-xs text-[var(--restaurant-text-muted)]">Scan the QR code at your table to place an order.</p>}</div>
      )}

      {tableResolved && tableStatus === "CLOSED" && <div role="status" className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8"><p className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">This table is currently unavailable. Please ask restaurant staff.</p></div>}

      {loadedCartKey === cartKey && customerOrders.length > 0 && (
        <section aria-live="polite" aria-label="Your orders" className="mx-auto mt-4 max-h-[55vh] max-w-7xl space-y-2 overflow-y-auto px-4 pb-1 sm:px-6 lg:px-8">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-xl bg-[#fff5ec]/95 py-2 backdrop-blur-sm">
            <div><h2 className="text-sm font-bold uppercase tracking-wider text-[var(--restaurant-primary)]">Your Orders</h2>{tableNumber && <p className="mt-0.5 text-xs text-[#786363]">Table {tableNumber}</p>}</div>
            <div className="text-right text-xs text-[#786363]"><p>{customerOrders.length} {customerOrders.length === 1 ? "order" : "orders"}</p><p className="font-mono font-bold text-[var(--restaurant-primary)]">Total ₹{customerOrdersTotal}</p></div>
          </header>
          {customerOrders.map((order) => <article key={order.id} className="rounded-xl border border-[#d9c5b9] bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wider text-[#987a6a]">#{order.orderNumber}</p><p className="mt-0.5 text-sm font-semibold text-[var(--restaurant-text)]">{orderStatusMessage[order.status]}</p>{order.createdAt && <p className="mt-0.5 text-xs text-[#8a7470]">{new Date(order.createdAt).toLocaleString()}</p>}</div>
              <span className="font-mono text-sm font-bold text-[var(--restaurant-primary)]">₹{order.total}</span>
            </div>
            {order.items && order.items.length > 0 && <ul className="mt-2 space-y-1 border-t border-[#ead9cf] pt-2">{order.items.map((item, index) => <li key={`${item.dishId}-${index}`} className="text-sm"><div className="flex justify-between gap-3"><span className="font-medium text-[#382729]">{item.quantity} × {item.dishNameSnapshot}</span><span className="font-mono text-xs text-[#695352]">₹{item.itemTotal}</span></div>{item.addons.length > 0 && <p className="mt-0.5 pl-4 text-xs text-[#786363]">{item.addons.map((addon) => `${addon.nameSnapshot}${addon.quantity > 1 ? ` × ${addon.quantity}` : ""}`).join(" · ")}</p>}</li>)}</ul>}
          </article>)}
        </section>
      )}

      <div className="customer-menu-controls sticky top-0 z-30 border-y border-[#ead9cf] bg-[#fffaf6]/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block min-w-0 flex-1">
              <span className="sr-only">Search menu</span>
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search dishes..." className="h-11 w-full rounded-xl border border-[#ead9cf] bg-white px-4 text-sm text-[var(--restaurant-text)] outline-none placeholder:text-[#9a8580] focus:border-[var(--restaurant-primary)] focus:ring-2 focus:ring-[var(--restaurant-primary)]/10" />
            </label>
            <button type="button" aria-pressed={vegetarianOnly} onClick={() => setVegetarianOnly((value) => !value)} className={`h-11 shrink-0 rounded-xl border px-4 text-sm font-semibold transition ${vegetarianOnly ? "border-[#3c7651] bg-[#e8f2e9] text-[#28563a]" : "border-[#ead9cf] bg-white text-[#514143] hover:border-[#b99a8d]"}`}>
              Veg only {vegetarianOnly ? "✓" : ""}
            </button>
          </div>
        </div>
        <CategoryNav categories={activeCategories} activeCategory={activeCategory} onCategoryChange={handleCategorySelect} totalDishCount={menu.dishes.length} />
      </div>

      <div id="menu-content" className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex items-center justify-between gap-3 text-sm text-[var(--restaurant-text-muted)]">
          <p>{filteredDishes.length} {filteredDishes.length === 1 ? "dish" : "dishes"}</p>
          {(searchQuery || vegetarianOnly) && <button type="button" onClick={() => { setSearchQuery(""); setVegetarianOnly(false); }} className="font-semibold text-[var(--restaurant-primary)] underline-offset-4 hover:underline">Clear filters</button>}
        </div>
        {filteredDishes.length === 0 && <div className="rounded-2xl border border-dashed border-[#d9c5b9] px-6 py-14 text-center text-sm text-[var(--restaurant-text-muted)]">{menu.dishes.length === 0 ? "This restaurant hasn’t added any dishes yet." : "No dishes match your search or filters. Try another search or clear the filters."}</div>}
        {activeCategories.map((category, index) => (
          <MenuSection
            key={category.id}
            category={category}
            dishes={filteredDishes}
            onDishClick={(dish: Dish) => setSelectedDishId(dish.id)}
            isFirstCategory={index === 0}
            videoMenuEnabled={videoMenuEnabled}
          />
        ))}
      </div>

      {selectedDish ? (
        <DishDetailModal
          key={selectedDish.id}
          dish={selectedDish}
          onClose={() => setSelectedDishId(null)}
          canOrder={canOrder}
          orderingEnabled={tableOrderingEnabled}
          videoMenuEnabled={videoMenuEnabled}
          onAddToCart={addToCart}
        />
      ) : null}

      {reservationsEnabled && reservationOpen && <ReservationPanel restaurantSlug={menu.restaurant.slug} onClose={() => setReservationOpen(false)} />}
      {wifiEnabled && wifiOpen && <WifiAccessPanel slug={menu.restaurant.slug} onClose={() => setWifiOpen(false)} />}

      {tableOrderingEnabled && loadedCartKey === cartKey && cart.length > 0 && (
        <button type="button" onClick={() => setCartOpen(true)} className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-2xl items-center justify-between gap-4 rounded-2xl bg-[var(--restaurant-primary)] px-5 py-3.5 text-left text-white shadow-2xl sm:inset-x-6 sm:bottom-5">
          <span className="flex items-center gap-3"><ShoppingBag className="h-5 w-5" /><span><span className="block text-sm font-bold">{cartCount} {cartCount === 1 ? "item" : "items"}</span><span className="text-xs text-white/70">View your cart</span></span></span>
          <span className="font-mono text-lg font-bold">₹{cartTotal} <span aria-hidden="true">→</span></span>
        </button>
      )}

      {tableOrderingEnabled && cartOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="cart-title" className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-5" onClick={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-[#fffaf6] shadow-2xl sm:rounded-3xl">
            <header className="flex items-center justify-between border-b border-[#ead9cf] px-5 py-4"><div><h2 id="cart-title" className="font-serif text-2xl font-bold text-[var(--restaurant-text)]">Your order</h2><p className="mt-1 text-xs text-[var(--restaurant-text-muted)]">Table {tableNumber}</p></div><button onClick={() => setCartOpen(false)} aria-label="Close cart" className="grid h-10 w-10 place-items-center rounded-full border border-[#ead9cf] text-[var(--restaurant-primary)]"><X className="h-5 w-5" /></button></header>
            <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
              {cart.map((line) => {
                const dish = menu.dishes.find((entry) => entry.id === line.dishId);
                if (!dish) return <p key={line.key} className="text-sm text-rose-700">A cart dish is no longer on this menu. Clear your cart and add it again.</p>;
                const addonNames = line.selections.flatMap((selection) => selection.addonIds.map((id) => dish.addonGroups?.find((group) => group.id === selection.groupId)?.addons.find((addon) => addon.id === id)?.name).filter((name): name is string => Boolean(name)));
                return <article key={line.key} className="rounded-2xl border border-[#ead9cf] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-[var(--restaurant-text)]">{dish.name}</h3>{addonNames.length > 0 && <p className="mt-1 text-xs leading-relaxed text-[var(--restaurant-text-muted)]">{addonNames.join(" · ")}</p>}</div><span className="font-mono text-sm font-bold text-[var(--restaurant-primary)]">₹{priceForLine({ ...line, quantity: 1 })}</span></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-1 rounded-xl border border-[#ead9cf] p-1"><button aria-label={`Decrease ${dish.name} quantity`} onClick={() => changeQuantity(line.key, -1)} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--restaurant-primary)]"><Minus className="h-4 w-4" /></button><span className="min-w-6 text-center text-sm font-semibold">{line.quantity}</span><button aria-label={`Increase ${dish.name} quantity`} onClick={() => changeQuantity(line.key, 1)} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--restaurant-primary)]"><Plus className="h-4 w-4" /></button></div><button onClick={() => setCart((current) => current.filter((entry) => entry.key !== line.key))} className="text-xs font-semibold text-[#8b3f43] underline underline-offset-4">Remove</button></div></article>;
              })}
            </div>
            <footer className="border-t border-[#ead9cf] bg-white p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><button type="button" onClick={() => setCart([])} className="text-xs font-semibold text-[#8b3f43] underline underline-offset-4">Clear cart</button><p className="font-mono text-lg font-bold text-[var(--restaurant-text)]">Subtotal ₹{cartTotal}</p></div>{orderError && <p role="alert" className="mb-3 text-sm text-rose-700">{orderError}</p>}<button type="button" disabled={!canOrder || cart.length === 0 || submitting || cart.some((line) => !menu.dishes.some((dish) => dish.id === line.dishId && dish.isAvailable))} onClick={() => void placeOrder()} className="h-12 w-full rounded-xl bg-[var(--restaurant-primary)] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">{submitting ? "Placing order…" : `Place order · ₹${cartTotal}`}</button></footer>
          </div>
        </div>
      )}
    </main>
  );
}
