import { NextResponse } from "next/server";
import { readToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/callback?token=<signed>&next=/account
 *
 * Sets the session cookie on a *top-level navigation* (not a fetch),
 * which survives proxy/iframe environments where Set-Cookie on fetch
 * responses is silently stripped.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const next = url.searchParams.get("next") || "/";

  // Validate — only accept well-formed, signed tokens
  const userId = readToken(token);
  if (!userId) {
    // Bad or expired token → send to login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Safe redirect target — must start with /
  const dest = next.startsWith("/") ? next : "/";

  const res = NextResponse.redirect(new URL(dest, req.url));
  res.cookies.set("wh_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
