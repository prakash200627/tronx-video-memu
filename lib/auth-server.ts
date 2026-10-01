import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, readAdminSession } from "@/lib/auth-core";
import { restaurantService } from "@/lib/services/restaurant.service";

export type AdminContext = {
  email: string;
  role: "SUPER_ADMIN" | "RESTAURANT_ADMIN";
  restaurantId?: string;
  restaurantSlug?: string;
};

export async function getAdminContext(): Promise<AdminContext | null> {
  const cookieStore = await cookies();
  const session = await readAdminSession(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
    process.env.AUTH_SECRET,
  );
  if (!session) return null;

  return {
    email: session.email,
    role: session.role,
    restaurantId: session.restaurantId,
    restaurantSlug: session.restaurantSlug ?? session.restaurantId,
  };
}

export function canManageRestaurant(
  context: AdminContext | null,
  restaurantId?: string,
): boolean {
  if (!context || !restaurantId) return false;
  if (context.role === "SUPER_ADMIN") return true;
  return (
    context.role === "RESTAURANT_ADMIN" && context.restaurantId === restaurantId
  );
}

export function isRestaurantAdmin(
  context: AdminContext | null,
): context is AdminContext & { restaurantId: string; restaurantSlug: string } {
  return Boolean(
    context?.role === "RESTAURANT_ADMIN" &&
    context.restaurantId &&
    context.restaurantSlug,
  );
}

export function forbiddenResponse() {
  return NextResponse.json(
    {
      success: false,
      error: "This account is not permitted to perform this action",
    },
    { status: 403 },
  );
}

export async function requireRestaurantAdmin() {
  const context = await getAdminContext();
  if (!context) {
    return { admin: null, error: unauthorizedResponse() } as const;
  }
  if (!isRestaurantAdmin(context)) {
    return { admin: null, error: forbiddenResponse() } as const;
  }
  const restaurant = await restaurantService.getById(context.restaurantId);
  if (
    !restaurant ||
    restaurant.isActive === false ||
    restaurant.slug !== context.restaurantSlug
  ) {
    return { admin: null, error: forbiddenResponse() } as const;
  }
  return { admin: context, error: null } as const;
}

export async function requireSuperAdmin() {
  const context = await getAdminContext();
  if (!context) {
    return { admin: null, error: unauthorizedResponse() } as const;
  }
  if (context.role !== "SUPER_ADMIN") {
    return { admin: null, error: forbiddenResponse() } as const;
  }
  return { admin: context, error: null } as const;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: "Authentication required" },
    { status: 401 },
  );
}
