"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Eye, EyeOff, Wifi, X } from "lucide-react";

type WifiDetails = { ssid: string; security: "WPA2" | "WPA3" | "OPEN"; password?: string };

export default function WifiAccessPanel({ slug, onClose }: { slug: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [details, setDetails] = useState<WifiDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    let active = true;
    void fetch(`/api/public/restaurants/${encodeURIComponent(slug)}/wifi`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { success: boolean; data?: WifiDetails; error?: string };
        if (!response.ok || !result.success || !result.data) throw new Error(result.error ?? "Wi-Fi information is unavailable.");
        if (active) setDetails(result.data);
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load Wi-Fi information."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const copyPassword = async () => {
    if (!details?.password) return;
    try {
      await navigator.clipboard.writeText(details.password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Copy is unavailable in this browser. You can reveal and select the password.");
    }
  };

  return <div role="dialog" aria-modal="true" aria-labelledby="wifi-title" aria-describedby="wifi-description" className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} tabIndex={-1} className="w-full max-w-md rounded-t-3xl bg-white p-5 text-[var(--restaurant-text)] shadow-2xl outline-none sm:rounded-3xl">
      <header className="flex items-center justify-between"><div><h2 id="wifi-title" className="flex items-center gap-2 font-serif text-2xl font-bold"><Wifi className="h-5 w-5" />Restaurant Wi-Fi</h2><p id="wifi-description" className="mt-1 text-xs text-[var(--restaurant-text-muted)]">Connect using the network details below.</p></div><button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close Wi-Fi details" className="grid h-10 w-10 place-items-center rounded-full border border-[#ead9cf] text-[var(--restaurant-primary)]"><X className="h-5 w-5" /></button></header>
      {loading ? <p role="status" className="mt-6 rounded-xl bg-[#fbf6f2] p-4 text-sm text-[var(--restaurant-text-muted)]">Loading Wi-Fi details…</p> : error ? <p role="alert" className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : details ? <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-[#ead9cf] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--restaurant-text-muted)]">Network name</p><p className="mt-1 break-all font-semibold">{details.ssid}</p></div>
        <div className="rounded-xl border border-[#ead9cf] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--restaurant-text-muted)]">Security</p><p className="mt-1 font-semibold">{details.security === "OPEN" ? "Open network" : details.security}</p></div>
        {details.password ? <div className="rounded-xl border border-[#ead9cf] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-[var(--restaurant-text-muted)]">Password</p><div className="mt-2 flex items-center gap-2"><input readOnly aria-label="Wi-Fi password" type={revealed ? "text" : "password"} value={details.password} className="h-10 min-w-0 flex-1 rounded-lg bg-[#fbf6f2] px-3 font-mono text-sm" /><button type="button" onClick={() => setRevealed((value) => !value)} aria-label={revealed ? "Hide password" : "Reveal password"} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#ead9cf]"><span className="sr-only">{revealed ? "Hide password" : "Reveal password"}</span>{revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button><button type="button" onClick={() => void copyPassword()} aria-label="Copy Wi-Fi password" className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[#ead9cf] px-3 text-xs font-semibold"><Copy className="h-4 w-4" />{copied ? "Copied" : "Copy"}</button></div></div> : details.security !== "OPEN" ? <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">The restaurant has not configured a Wi-Fi password. Please ask staff for help.</p> : null}
      </div> : null}
    </section>
  </div>;
}
