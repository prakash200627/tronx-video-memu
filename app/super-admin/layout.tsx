"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/shared/LogoutButton";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === "/super-admin/login") return children;

  return (
    <div className="flex min-h-screen bg-black text-white">
      <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-zinc-950 px-4 py-5">
        <Link href="/super-admin" className="mb-8 flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white font-black text-black">
            T
          </span>
          <span>
            <span className="block text-sm font-bold">TRONX</span>
            <span className="block text-xs text-white/50">Super Admin</span>
          </span>
        </Link>
        <nav className="space-y-1">
          <Link
            href="/super-admin"
            className={`block rounded-lg px-3 py-2.5 text-sm ${pathname === "/super-admin" ? "bg-white text-black" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
          >
            Dashboard
          </Link>
        </nav>
        <div className="mt-auto border-t border-white/10 pt-4">
          <LogoutButton
            redirectTo="/super-admin/login"
            role="SUPER_ADMIN"
            showLabel
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white"
          />
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-x-hidden p-5 sm:p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
