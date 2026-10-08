import { NextResponse } from "next/server";
import { requireRestaurantFeature } from "@/lib/feature-access";
import { restaurantService } from "@/lib/services/restaurant.service";

export const dynamic = "force-dynamic";
const noStore = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
};

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const restaurant = await restaurantService.getBySlug(slug);
    if (!restaurant || restaurant.isActive === false) {
      return NextResponse.json({ success: false, error: "Restaurant not found." }, { status: 404, headers: noStore });
    }
    const feature = requireRestaurantFeature(restaurant, "WIFI");
    if (!feature.allowed) {
      return NextResponse.json({ success: false, error: "Wi-Fi information is unavailable." }, { status: 404, headers: noStore });
    }
    const data = await restaurantService.getWifiCustomerDetails(slug);
    if (!data) {
      return NextResponse.json({ success: false, error: "Wi-Fi information is not configured." }, { status: 404, headers: noStore });
    }
    return NextResponse.json({ success: true, data }, { headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to load Wi-Fi details." }, { status: 500, headers: noStore });
  }
}
