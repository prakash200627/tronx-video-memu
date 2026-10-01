import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, readAdminSession } from "@/lib/auth-core";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    data: { message: "Logged out successfully" },
  });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const session = await readAdminSession(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
    process.env.AUTH_SECRET,
  );
  const destination =
    session?.role === "SUPER_ADMIN" ? "/super-admin/login" : "/admin/login";
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
