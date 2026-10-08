import { NextResponse } from "next/server";
import { sessionCookieForRole } from "@/lib/auth-core";

export async function POST() {
  const response = NextResponse.json({ success: true, data: { message: "Logged out successfully" } });
  response.cookies.set({ name: sessionCookieForRole("CAPTAIN"), value: "", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
