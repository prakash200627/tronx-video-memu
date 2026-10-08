"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import type { FeatureKey } from "@/types";

export default function AdminShell({ children, features, restaurantIsOpen }: { children: React.ReactNode; features: Record<FeatureKey, boolean>; restaurantIsOpen: boolean }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const restaurantSlug = pathname.match(/^\/admin\/([^/]+)(?:\/|$)/)?.[1] ?? "";
  if (pathname === "/admin/login") return <>{children}</>;
  return <div className="flex min-h-screen bg-black text-white selection:bg-white/20">
    <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} features={features} />
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} restaurantSlug={restaurantSlug || undefined} restaurantIsOpen={restaurantIsOpen} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-6xl">{children}</div></main>
    </div>
  </div>;
}
