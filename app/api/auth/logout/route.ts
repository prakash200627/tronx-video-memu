import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { RESTAURANT_ADMIN_SESSION_COOKIE, SUPER_ADMIN_SESSION_COOKIE, readAdminSession, sessionCookieForRole } from "@/lib/auth-core";

export const runtime = "nodejs";

function clearSession(response: NextResponse, role: "SUPER_ADMIN" | "RESTAURANT_ADMIN") {
  response.cookies.set({ name: sessionCookieForRole(role), value: "", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export async function POST(request: Request) {
  let role: "SUPER_ADMIN" | "RESTAURANT_ADMIN";
  try {
    const body = await request.json() as { role?: unknown };
    if (body.role !== "SUPER_ADMIN" && body.role !== "RESTAURANT_ADMIN") return NextResponse.json({ success: false, error: "Invalid logout role" }, { status: 400 });
    role = body.role;
  } catch { return NextResponse.json({ success: false, error: "Invalid logout request" }, { status: 400 }); }
  const response = NextResponse.json({ success: true, data: { message: "Logged out successfully" } });
  clearSession(response, role);
  return response;
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const requestedRole = new URL(request.url).searchParams.get("role");
  const role = requestedRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : "RESTAURANT_ADMIN";
  const cookieName = role === "SUPER_ADMIN" ? SUPER_ADMIN_SESSION_COOKIE : RESTAURANT_ADMIN_SESSION_COOKIE;
  const session = await readAdminSession(cookieStore.get(cookieName)?.value, process.env.AUTH_SECRET);
  if (!session || session.role !== role) return NextResponse.redirect(new URL(role === "SUPER_ADMIN" ? "/super-admin/login" : "/admin/login", request.url));
  const response = NextResponse.redirect(new URL(role === "SUPER_ADMIN" ? "/super-admin/login" : "/admin/login", request.url));
  clearSession(response, role);
  return response;
}
