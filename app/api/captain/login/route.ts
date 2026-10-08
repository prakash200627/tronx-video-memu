import { NextResponse } from "next/server";
import { createAdminSession, SESSION_TTL_SECONDS, sessionCookieForRole } from "@/lib/auth-core";
import { requireRestaurantFeature } from "@/lib/feature-access";
import { captainLoginSchema } from "@/lib/validations";
import { restaurantService } from "@/lib/services/restaurant.service";
import { captainService } from "@/lib/services/captain.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = captainLoginSchema.parse(await request.json());
    const secret = process.env.AUTH_SECRET;
    if (!secret) return NextResponse.json({ success: false, error: "Authentication is not configured" }, { status: 503 });
    const restaurant = await restaurantService.getBySlug(input.restaurantSlug);
    if (!restaurant || restaurant.isActive === false) return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    const feature = requireRestaurantFeature(restaurant, "CAPTAIN_ACCESS");
    if (!feature.allowed) return NextResponse.json({ success: false, error: feature.reason }, { status: 403 });
    const captain = await captainService.authenticate(restaurant.id, input.email, input.password);
    if (!captain) return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    const session = await createAdminSession(captain.email, secret, "CAPTAIN", restaurant.id, restaurant.slug, captain.id, captain.updatedAt);
    const response = NextResponse.json({ success: true, data: { role: "CAPTAIN", name: captain.name, restaurantSlug: restaurant.slug } });
    response.cookies.set({ name: sessionCookieForRole("CAPTAIN"), value: session, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_TTL_SECONDS });
    return response;
  } catch (error) {
    const validation = error && typeof error === "object" && "issues" in error;
    return NextResponse.json({ success: false, error: validation ? "Invalid login details" : "Unable to sign in" }, { status: validation ? 400 : 500 });
  }
}
