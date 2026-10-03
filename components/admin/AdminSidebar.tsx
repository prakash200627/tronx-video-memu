"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  FolderTree,
  Sliders,
  Store,
  Clock,
  Image as ImageIcon,
  ExternalLink,
  ChevronDown,
  QrCode,
  ClipboardList,
} from "lucide-react";
import { useState } from "react";

type AdminSidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function AdminSidebar({
  isOpen = false,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const restaurantSlug = pathname.match(/^\/admin\/([^/]+)(?:\/|$)/)?.[1] ?? "";
  const [isMenuOpen, setIsMenuOpen] = useState(
    pathname.startsWith("/admin/menu") || pathname.includes("/menu/"),
  );

  const buildRoute = (suffix: string) =>
    restaurantSlug ? `/admin/${restaurantSlug}${suffix}` : `/admin${suffix}`;

  const isActive = (path: string, exact = false) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  const navItems = [
    {
      label: "Dashboard",
      href: restaurantSlug ? `/admin/${restaurantSlug}` : "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Restaurant Profile",
      href: buildRoute("/profile"),
      icon: Store,
    },
    {
      label: "Availability",
      href: buildRoute("/availability"),
      icon: Clock,
    },
    {
      label: "Media",
      href: buildRoute("/media"),
      icon: ImageIcon,
    },
    { label: "Tables", href: buildRoute("/tables"), icon: QrCode },
    { label: "Orders", href: buildRoute("/orders"), icon: ClipboardList },
  ];

  const menuSubItems = [
    {
      label: "Categories",
      href: buildRoute("/menu/categories"),
      icon: FolderTree,
    },
    {
      label: "Dishes",
      href: buildRoute("/menu/dishes"),
      icon: UtensilsCrossed,
    },
    {
      label: "Add-ons",
      href: buildRoute("/menu/addons"),
      icon: Sliders,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-zinc-950 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Link
            href={restaurantSlug ? `/admin/${restaurantSlug}` : "/admin"}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-black text-black">
              T
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight text-white">
                TRONX Admin
              </span>
              <span className="block text-[10px] text-white/50">
                Restaurant Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4 scrollbar-none">
          {/* Main Dashboard Link */}
          <Link
            href={restaurantSlug ? `/admin/${restaurantSlug}` : "/admin"}
            onClick={onClose}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive(
                restaurantSlug ? `/admin/${restaurantSlug}` : "/admin",
                true,
              )
                ? "bg-white text-black"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span>Dashboard</span>
          </Link>

          {/* Menu Dropdown Group */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                pathname.startsWith("/admin/menu")
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <UtensilsCrossed className="h-4 w-4 shrink-0" />
                <span>Menu</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  isMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Sub-menu items */}
            {isMenuOpen && (
              <div className="mt-1 space-y-1 pl-4">
                {menuSubItems.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                        active
                          ? "bg-white text-black font-semibold"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Other Sections */}
          <div className="pt-2 space-y-1.5 border-t border-white/5 mt-2">
            {navItems.slice(1).map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-white text-black"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <Link
            href={restaurantSlug ? `/menu/${restaurantSlug}` : "/admin/login"}
            target="_blank"
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/3 px-3.5 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/8 hover:text-white"
          >
            <span>Customer Menu</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </div>
      </aside>
    </>
  );
}
