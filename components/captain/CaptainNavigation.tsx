"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutDashboard, LogOut, QrCode } from "lucide-react";

export default function CaptainNavigation({ slug }: { slug: string }) {
  const pathname = usePathname();
  const root = `/captain/${slug}`;
  const links = [
    { href: root, label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: `${root}/orders`, label: "Orders", icon: ClipboardList, exact: false },
    { href: `${root}/tables`, label: "Tables", icon: QrCode, exact: false },
  ];
  const logout = async () => {
    await fetch("/api/captain/logout", { method: "POST" });
    window.location.replace("/captain/login");
  };
  return <aside className="flex w-full flex-col border-b border-white/10 bg-zinc-950 lg:min-h-screen lg:w-60 lg:border-b-0 lg:border-r">
    <Link href={root} className="flex h-16 items-center gap-3 border-b border-white/10 px-5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-black text-black">T</span><span><strong className="block text-sm text-white">TRONX Captain</strong><span className="text-[10px] text-white/45">Restaurant Operations</span></span></Link>
    <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-1 lg:flex-col">
      {links.map(({ href, label, icon: Icon, exact }) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${exact ? pathname === href : pathname.startsWith(href) ? "bg-white text-black" : "text-white/70 hover:bg-white/5"} ${exact && pathname !== href ? "text-white/70 hover:bg-white/5" : ""}`}><Icon className="h-4 w-4" />{label}</Link>)}
    </nav>
    <button type="button" onClick={() => void logout()} className="m-3 inline-flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4" />Logout</button>
  </aside>;
}
