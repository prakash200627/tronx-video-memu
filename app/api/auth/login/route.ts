import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  SESSION_TTL_SECONDS,
} from "@/lib/auth-core";
import { restaurantService } from "@/lib/services/restaurant.service";

export const runtime = "nodejs";

function matchesSecret(value: string, expected: string): boolean {
  const actualBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function normalizeRestaurantId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getRestaurantAdminConfigs() {
  const restaurantConfigs = [
    {
      restaurantSlug:
        process.env.MOAI_KITCHEN_ADMIN_RESTAURANT_SLUG || "moai-kitchen",
      email: process.env.MOAI_KITCHEN_ADMIN_EMAIL,
      password: process.env.MOAI_KITCHEN_ADMIN_PASSWORD,
    },
    {
      restaurantSlug:
        process.env.NATIVE_SOUTH_ADMIN_RESTAURANT_SLUG || "native-south",
      email: process.env.NATIVE_SOUTH_ADMIN_EMAIL,
      password: process.env.NATIVE_SOUTH_ADMIN_PASSWORD,
    },
  ];

  return restaurantConfigs.filter(
    (config): config is typeof config & { email: string; password: string } =>
      Boolean(config.email && config.password),
  );
}

export async function POST(request: Request) {
  try {
    const { email, password, role, restaurantSlug } =
      (await request.json()) as {
        email?: unknown;
        password?: unknown;
        role?: unknown;
        restaurantSlug?: unknown;
      };

    const authSecret = process.env.AUTH_SECRET;
    if (!authSecret) {
      return NextResponse.json(
        { success: false, error: "Authentication is not configured" },
        { status: 503 },
      );
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (
      role === "SUPER_ADMIN" &&
      process.env.SUPER_ADMIN_EMAIL &&
      process.env.SUPER_ADMIN_PASSWORD &&
      matchesSecret(email, process.env.SUPER_ADMIN_EMAIL) &&
      matchesSecret(password, process.env.SUPER_ADMIN_PASSWORD)
    ) {
      const session = await createAdminSession(
        email,
        authSecret,
        "SUPER_ADMIN",
      );
      const response = NextResponse.json({
        success: true,
        data: { email, role: "SUPER_ADMIN" },
      });
      response.cookies.set({
        name: ADMIN_SESSION_COOKIE,
        value: session,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
      });
      return response;
    }

    if (role !== "RESTAURANT_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const restaurantAdmins = getRestaurantAdminConfigs();
    const matchingRestaurantAdmin = restaurantAdmins.find(
      (config) =>
        matchesSecret(email, config.email) &&
        matchesSecret(password, config.password),
    );

    if (!matchingRestaurantAdmin) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const requestedRestaurantSlug =
      typeof restaurantSlug === "string"
        ? normalizeRestaurantId(restaurantSlug)
        : matchingRestaurantAdmin.restaurantSlug;

    if (
      requestedRestaurantSlug &&
      requestedRestaurantSlug !== matchingRestaurantAdmin.restaurantSlug
    ) {
      return NextResponse.json(
        { success: false, error: "Restaurant access denied" },
        { status: 403 },
      );
    }

    const restaurant = await restaurantService.getBySlug(
      matchingRestaurantAdmin.restaurantSlug,
    );
    if (!restaurant || restaurant.isActive === false) {
      return NextResponse.json(
        { success: false, error: "Restaurant access is unavailable" },
        { status: 403 },
      );
    }

    const session = await createAdminSession(
      email,
      authSecret,
      "RESTAURANT_ADMIN",
      restaurant.id,
      restaurant.slug,
    );
    const response = NextResponse.json({
      success: true,
      data: {
        email,
        role: "RESTAURANT_ADMIN",
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
      },
    });
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: session,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid login request" },
      { status: 400 },
    );
  }
}
