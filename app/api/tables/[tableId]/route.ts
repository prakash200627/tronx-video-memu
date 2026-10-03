import { NextResponse } from "next/server";
import { requireRestaurantAdmin } from "@/lib/auth-server";
import { tableService, TableServiceError } from "@/lib/services/table.service";
import { updateTableSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ tableId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;
    const { tableId } = await params;
    const input = updateTableSchema.parse(await request.json());
    const table = await tableService.update(admin.restaurantId, tableId, input);
    if (!table) return NextResponse.json({ success: false, error: "Table not found." }, { status: 404 });
    return NextResponse.json({ success: true, data: table });
  } catch (error) {
    const validation = error && typeof error === "object" && "issues" in error;
    const duplicate = error && typeof error === "object" && "code" in error && error.code === 11000;
    return NextResponse.json({ success: false, error: validation ? "Validation failed" : error instanceof TableServiceError ? error.message : duplicate ? "A table with this number already exists." : "Unable to update table." }, { status: validation ? 400 : error instanceof TableServiceError || duplicate ? 409 : 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { admin, error } = await requireRestaurantAdmin();
    if (error) return error;
    const { tableId } = await params;
    const result = await tableService.delete(admin.restaurantId, tableId);
    if (!result.deleted) {
      return NextResponse.json(
        { success: false, error: result.reason === "HAS_ORDERS" ? "This table has order history and cannot be deleted. Deactivate it instead." : "Table not found." },
        { status: result.reason === "HAS_ORDERS" ? 409 : 404 },
      );
    }
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to delete table." }, { status: 500 });
  }
}
