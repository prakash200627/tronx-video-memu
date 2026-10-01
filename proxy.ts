import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, readAdminSession } from "@/lib/auth-core";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminLoginRoute = pathname === "/admin/login";
  const isSuperAdminLoginRoute = pathname === "/super-admin/login";
  const isAuthLoginRoute = pathname === "/api/auth/login";
  const isLogoutRoute = pathname === "/api/auth/logout";
  const isApiRequest = pathname.startsWith("/api/");
  const isPublicCustomerRoute =
    pathname === "/" ||
    pathname.startsWith("/menu/") ||
    (request.method === "GET" && pathname.startsWith("/api/restaurants/"));

  if (isAuthLoginRoute || isLogoutRoute || isPublicCustomerRoute) {
    return NextResponse.next();
  }

  const session = await readAdminSession(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    process.env.AUTH_SECRET,
  );
  const isAuthenticated = Boolean(session);

  if (isAdminLoginRoute || isSuperAdminLoginRoute) {
    if (!session) return NextResponse.next();
    if (session.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/super-admin", request.url));
    }
    const targetRestaurant =
      session.restaurantSlug || session.restaurantId || "";
    return NextResponse.redirect(
      new URL(
        targetRestaurant ? `/admin/${targetRestaurant}` : "/admin",
        request.url,
      ),
    );
  }

  if (pathname.startsWith("/super-admin")) {
    if (!session || session.role !== "SUPER_ADMIN") {
      const loginUrl = new URL("/super-admin/login", request.url);
      loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== "RESTAURANT_ADMIN") {
      return NextResponse.redirect(new URL("/super-admin", request.url));
    }
    if (pathname === "/admin" || pathname === "/admin/") {
      const redirectSlug = session.restaurantSlug || session.restaurantId;
      return NextResponse.redirect(
        new URL(
          redirectSlug ? `/admin/${redirectSlug}` : "/admin/login",
          request.url,
        ),
      );
    }
    const requestedRestaurant = pathname.split("/admin/")[1]?.split("/")[0];
    const sessionRestaurant = session.restaurantSlug || session.restaurantId;
    if (requestedRestaurant && requestedRestaurant !== sessionRestaurant) {
      return NextResponse.redirect(
        new URL(`/admin/${sessionRestaurant || "login"}`, request.url),
      );
    }
    return NextResponse.next();
  }

  if (!isApiRequest) return NextResponse.next();
  if (isAuthenticated) return NextResponse.next();

  return NextResponse.json(
    { success: false, error: "Authentication required" },
    { status: 401 },
  );
}

export const config = {
  matcher: ["/admin/:path*", "/super-admin/:path*", "/api/:path*"],
};
