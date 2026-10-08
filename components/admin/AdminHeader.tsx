"use client";

import { Menu, ShieldCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/shared/LogoutButton";

type AdminHeaderProps = {
  onToggleSidebar: () => void;
  restaurantSlug?: string;
  restaurantIsOpen: boolean;
};

export default function AdminHeader({
  onToggleSidebar,
  restaurantSlug,
  restaurantIsOpen,
}: AdminHeaderProps) {
  const restaurantName = restaurantSlug
    ? restaurantSlug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Restaurant Admin";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-zinc-950/80 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:bg-white/5 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h2 className="text-sm font-semibold tracking-tight text-white sm:text-base">
            {restaurantName}
          </h2>
          <p className="text-[11px] text-white/50">Restaurant Admin Console</p>
        </div>
      </div>

      {/* Right: Status badge & Preview Menu link */}
      <div className="flex items-center gap-3">
        <div className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 sm:flex ${restaurantIsOpen ? "border-emerald-500/20 bg-emerald-500/10" : "border-rose-500/20 bg-rose-500/10"}`}>
          <span className={`h-2 w-2 rounded-full ${restaurantIsOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
          <span className={`text-xs font-medium ${restaurantIsOpen ? "text-emerald-400" : "text-rose-400"}`}>
            {restaurantIsOpen ? "Open for Orders" : "Closed for Orders"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
          <ShieldCheck className="h-3.5 w-3.5 text-white/50" />
          <span className="hidden sm:inline">Admin Mode</span>
        </div>

        <Link
          href={restaurantSlug ? `/menu/${restaurantSlug}` : "/"}
          target="_blank"
          className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-white/90"
        >
          <span>Preview Menu</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
        <LogoutButton
          redirectTo="/admin/login"
          role="RESTAURANT_ADMIN"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 transition hover:bg-white/5 hover:text-white"
        />
      </div>
    </header>
  );
}
