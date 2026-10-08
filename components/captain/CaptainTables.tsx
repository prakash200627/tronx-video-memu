import type { RestaurantTable } from "@/types";

const statusStyle: Record<RestaurantTable["status"], string> = {
  OPEN: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  OCCUPIED: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  CLOSED: "border-white/15 bg-white/5 text-white/55",
};

export default function CaptainTables({ initialTables }: { initialTables: RestaurantTable[] }) {
  return <div className="space-y-5"><header><h1 className="text-2xl font-bold sm:text-3xl">Tables</h1><p className="mt-1 text-sm text-white/55">Table availability and status are read-only.</p></header>
    {initialTables.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{initialTables.map((table) => <article key={table.id} className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">Table {table.tableNumber}</h2>{table.label && <p className="mt-1 text-sm text-white/50">{table.label}</p>}</div><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle[table.status]}`}>{table.status}</span></div><p className="mt-4 text-xs text-white/40">{table.isActive ? "Active" : "Inactive"}</p></article>)}</div> : <p className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/45">No tables have been added.</p>}
  </div>;
}
