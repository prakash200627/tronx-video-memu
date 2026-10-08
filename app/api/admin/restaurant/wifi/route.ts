import { NextResponse } from "next/server";
import { requireRestaurantAdmin } from "@/lib/auth-server";
import { requireRestaurantFeature } from "@/lib/feature-access";
import { restaurantService } from "@/lib/services/restaurant.service";
import { restaurantWifiUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store, max-age=0" };

async function authorize() {
  const { admin, error } = await requireRestaurantAdmin();
  if (error) return { admin: null, error } as const;
  const restaurant = await restaurantService.getById(admin.restaurantId);
  if (!restaurant || restaurant.isActive === false) {
    return { admin: null, error: NextResponse.json({ success: false, error: "Restaurant not found." }, { status: 404, headers: noStore }) } as const;
  }
  const feature = requireRestaurantFeature(restaurant, "WIFI");
  if (!feature.allowed) {
    return { admin: null, error: NextResponse.json({ success: false, error: feature.reason }, { status: 403, headers: noStore }) } as const;
  }
  return { admin, error: null } as const;
}

export async function GET() {
  const { admin, error } = await authorize();
  if (error) return error;
  try {
    const data = await restaurantService.getWifiAdminConfiguration(admin.restaurantId);
    return data
      ? NextResponse.json({ success: true, data }, { headers: noStore })
      : NextResponse.json({ success: false, error: "Restaurant not found." }, { status: 404, headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to load Wi-Fi settings." }, { status: 500, headers: noStore });
  }
}

export async function PATCH(request: Request) {
  const { admin, error } = await authorize();
  if (error) return error;
  const parsed = restaurantWifiUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid Wi-Fi settings." }, { status: 400, headers: noStore });
  }
  try {
    const data = await restaurantService.updateWifiAdminConfiguration(admin.restaurantId, parsed.data);
    return data
      ? NextResponse.json({ success: true, data }, { headers: noStore })
      : NextResponse.json({ success: false, error: "Restaurant not found." }, { status: 404, headers: noStore });
  } catch (cause) {
    const message = cause instanceof Error && cause.message === "Enter a password for this secured Wi-Fi network."
      ? cause.message
      : "Unable to save Wi-Fi settings. Check the server Wi-Fi encryption configuration.";
    const status = message.startsWith("Enter a password") ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status, headers: noStore });
  }
}
