"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const restaurantSlug = pathname.match(/^\/admin\/([^/]+)(?:\/|$)/)?.[1] ?? "";

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-black text-white selection:bg-white/20">
      {/* Sidebar Navigation */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <AdminHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          restaurantSlug={restaurantSlug || undefined}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
