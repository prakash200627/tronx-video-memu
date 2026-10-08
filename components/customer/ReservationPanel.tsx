"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { getReservationLocalDate } from "@/lib/reservations/time";

type AvailableTable = { id: string; tableNumber: number; label?: string; capacity: number };
type Availability = { endTime: string; tables: AvailableTable[] };
type ReservationResult = { id: string; status: "PENDING" };

async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  const result = await response.json() as { success: boolean; data?: T; error?: string };
  if (!response.ok || !result.success) throw new Error(result.error ?? "Unable to complete the request.");
  return result.data as T;
}

export default function ReservationPanel({ restaurantSlug, onClose }: { restaurantSlug: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const availabilityRequestRef = useRef(0);
  const [reservationDate, setReservationDate] = useState(getReservationLocalDate());
  const [startTime, setStartTime] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [selectedTable, setSelectedTable] = useState<AvailableTable | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  const [reservation, setReservation] = useState<ReservationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus({ preventScroll: true });

    const getFocusableElements = () => Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    ).filter((element) => element.getAttribute("aria-hidden") !== "true");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusableElements();
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (previousActiveElement?.isConnected) previousActiveElement.focus({ preventScroll: true });
    };
  }, []);

  const invalidateAvailability = () => {
    availabilityRequestRef.current += 1;
    setAvailability(null);
    setSelectedTable(null);
    setError("");
  };

  const checkAvailability = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(""); setAvailability(null); setSelectedTable(null);
    const requestId = ++availabilityRequestRef.current;
    try {
      const result = await post<Availability>("/api/public/reservations/availability", { slug: restaurantSlug, reservationDate, startTime, guestCount: Number(guestCount) });
      if (requestId === availabilityRequestRef.current) setAvailability(result);
    } catch (cause) { if (requestId === availabilityRequestRef.current) setError(cause instanceof Error ? cause.message : "Unable to check availability."); }
    finally { setBusy(false); }
  };

  const submitReservation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selectedTable) return;
    setBusy(true); setError("");
    try {
      const created = await post<ReservationResult>("/api/public/reservations", {
        slug: restaurantSlug,
        tableId: selectedTable.id,
        customerName: name,
        customerPhone: phone,
        customerEmail: email || undefined,
        reservationDate,
        startTime,
        guestCount: Number(guestCount),
        specialRequest: specialRequest || undefined,
      });
      setReservation(created);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create reservation."); }
    finally { setBusy(false); }
  };

  return <div role="dialog" aria-modal="true" aria-labelledby="reservation-title" aria-describedby="reservation-description" className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} tabIndex={-1} className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white text-[var(--restaurant-text)] shadow-2xl outline-none sm:rounded-3xl">
      <header className="flex items-center justify-between border-b border-[#ead9cf] px-5 py-4"><div><h2 id="reservation-title" className="font-serif text-2xl font-bold">Reserve a Table</h2><p id="reservation-description" className="mt-1 text-xs text-[var(--restaurant-text-muted)]">Reservations are for 60 minutes · India Standard Time</p></div><button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close reservation" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#ead9cf] text-[var(--restaurant-primary)]"><X className="h-5 w-5" /></button></header>
      <div className="overflow-y-auto p-5">
        {reservation ? <div className="space-y-3 py-8 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-2xl text-emerald-700">✓</div><h3 className="font-serif text-2xl font-bold">Request received</h3><p className="text-sm leading-relaxed text-[var(--restaurant-text-muted)]">Your reservation for Table {selectedTable?.tableNumber} is pending restaurant confirmation. The restaurant can contact you at {phone}.</p><button type="button" onClick={onClose} className="mt-3 h-11 rounded-xl bg-[var(--restaurant-primary)] px-6 text-sm font-bold text-white">Back to menu</button></div> : <>
          <form onSubmit={checkAvailability} className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-semibold text-[var(--restaurant-text-muted)]">Date<input type="date" min={getReservationLocalDate()} value={reservationDate} onChange={(event) => { invalidateAvailability(); setReservationDate(event.target.value); }} required className="mt-1.5 h-11 w-full rounded-xl border border-[#ead9cf] bg-white px-3 text-sm text-[var(--restaurant-text)]" /></label>
            <label className="text-xs font-semibold text-[var(--restaurant-text-muted)]">Start time<input type="time" step={900} value={startTime} onChange={(event) => { invalidateAvailability(); setStartTime(event.target.value); }} required className="mt-1.5 h-11 w-full rounded-xl border border-[#ead9cf] bg-white px-3 text-sm text-[var(--restaurant-text)]" /></label>
            <label className="text-xs font-semibold text-[var(--restaurant-text-muted)]">Guests<input type="number" min={1} max={1000} value={guestCount} onChange={(event) => { invalidateAvailability(); setGuestCount(event.target.value); }} required className="mt-1.5 h-11 w-full rounded-xl border border-[#ead9cf] bg-white px-3 text-sm text-[var(--restaurant-text)]" /></label>
            <button disabled={busy} className="h-11 rounded-xl bg-[var(--restaurant-primary)] px-4 text-sm font-bold text-white disabled:opacity-50 sm:col-span-3">{busy ? "Checking…" : "Check availability"}</button>
          </form>
          {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          {availability && <div className="mt-5 space-y-4">
            <div><h3 className="text-sm font-bold">Available tables</h3><p className="mt-1 text-xs text-[var(--restaurant-text-muted)]">{startTime}–{availability.endTime} · {Number(guestCount)} guests</p></div>
            {availability.tables.length ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{availability.tables.map((table) => <button key={table.id} type="button" onClick={() => setSelectedTable(table)} className={`rounded-xl border p-3 text-left transition ${selectedTable?.id === table.id ? "border-[var(--restaurant-primary)] bg-[var(--restaurant-primary)]/5 ring-1 ring-[var(--restaurant-primary)]" : "border-[#ead9cf] hover:border-[var(--restaurant-primary)]/50"}`}><span className="block text-sm font-bold">Table {table.tableNumber}</span><span className="mt-1 block text-xs text-[var(--restaurant-text-muted)]">Seats {table.capacity}{table.label ? ` · ${table.label}` : ""}</span></button>)}</div> : <p className="rounded-xl bg-[#fbf6f2] p-4 text-sm text-[var(--restaurant-text-muted)]">No tables are available for this time and party size. Try another time.</p>}
            {selectedTable && <form onSubmit={submitReservation} className="grid gap-3 border-t border-[#ead9cf] pt-4 sm:grid-cols-2">
              <h3 className="text-sm font-bold sm:col-span-2">Your details · Table {selectedTable.tableNumber}</h3>
              <label className="text-xs font-semibold text-[var(--restaurant-text-muted)]">Name<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required autoComplete="name" className="mt-1.5 h-11 w-full rounded-xl border border-[#ead9cf] px-3 text-sm" /></label>
              <label className="text-xs font-semibold text-[var(--restaurant-text-muted)]">Phone<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} minLength={7} maxLength={24} required autoComplete="tel" className="mt-1.5 h-11 w-full rounded-xl border border-[#ead9cf] px-3 text-sm" /></label>
              <label className="text-xs font-semibold text-[var(--restaurant-text-muted)] sm:col-span-2">Email (optional)<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" className="mt-1.5 h-11 w-full rounded-xl border border-[#ead9cf] px-3 text-sm" /></label>
              <label className="text-xs font-semibold text-[var(--restaurant-text-muted)] sm:col-span-2">Special request (optional)<textarea value={specialRequest} onChange={(event) => setSpecialRequest(event.target.value)} maxLength={1000} rows={3} className="mt-1.5 w-full resize-y rounded-xl border border-[#ead9cf] px-3 py-2 text-sm" /></label>
              <button disabled={busy} className="h-12 rounded-xl bg-[var(--restaurant-primary)] px-4 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">{busy ? "Sending request…" : "Confirm reservation request"}</button>
            </form>}
          </div>}
        </>}
      </div>
    </section>
  </div>;
}
