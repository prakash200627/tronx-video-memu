import { notFound } from "next/navigation";
import CustomerMenu from "@/components/customer/CustomerMenu";
import { restaurantService } from "@/lib/services/restaurant.service";
import { tableService } from "@/lib/services/table.service";

export const dynamic = "force-dynamic";

export default async function RestaurantMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string | string[] }>;
}) {
  const { slug } = await params;
  const { table: rawTable } = await searchParams;
  const menu = await restaurantService.getFullMenu(slug);

  if (!menu) notFound();

  const tableValue = Array.isArray(rawTable) ? rawTable[0] : rawTable;
  const tableNumber = tableValue && /^\d{1,4}$/.test(tableValue) ? Number(tableValue) : null;
  const table = tableNumber ? await tableService.getActiveByNumber(menu.restaurant.id, tableNumber) : null;
  const invalidTable = Boolean(tableValue) && (!tableNumber || !table);

  return <CustomerMenu initialMenu={menu} restaurantIdOrSlug={slug} tableNumber={table?.tableNumber ?? null} tableId={table?.id ?? null} tableStatus={table?.status ?? null} invalidTable={invalidTable} />;
}
