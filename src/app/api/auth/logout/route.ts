import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/logout
 *
 * Clears the session cookie via a top-level navigation and redirects to /.
 */
export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set("wh_session", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
