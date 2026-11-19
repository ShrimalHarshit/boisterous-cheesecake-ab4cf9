import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import {
  clearSession,
  getSessionUser,
  hashPassword,
  issueToken,
  publicUser,
  verifyPassword,
} from "@/lib/auth";
import { VALID_MOBILE } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "logout") {
    await clearSession();
    return NextResponse.json({ ok: true, redirect: "/" });
  }

  if (action === "provider") {
    const provider = body.provider === "Apple" ? "Apple" : "Google";
    const label = `${provider} User`;
    await ensureSeed();
    const found = await db
      .select()
      .from(users)
      .where(sql`${users.provider} = ${provider}`)
      .orderBy(users.id)
      .limit(1);
    let user = found[0];
    if (!user) {
      const [row] = await db
        .insert(users)
        .values({
          name: label,
          mobile: `9${String(Date.now()).slice(-9)}`,
          provider,
          role: "owner",
          city: null,
        })
        .returning();
      user = row;
    }
    if (user.blocked) {
      return NextResponse.json({ error: "This account has been blocked." }, { status: 403 });
    }
    const token = issueToken(user.id);
    return NextResponse.json({
      ok: true,
      user: publicUser(user),
      token,
      redirect: body.next || "/",
    });
  }

  const mobile = String(body.mobile || "").replace(/\D/g, "").slice(-10);
  const password = String(body.password || "");
  const name = String(body.name || "").trim();

  if (!VALID_MOBILE.test(mobile)) {
    return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  if (action === "signup") {
    await ensureSeed();
    if (name.length < 2) {
      return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
    }
    const dup = await db.select().from(users).where(eq(users.mobile, mobile)).limit(1);
    const hit = dup[0];

    if (hit && hit.passwordHash) {
      return NextResponse.json(
        { error: "This number is already registered — log in instead." },
        { status: 409 },
      );
    }

    if (hit) {
      const [row] = await db
        .update(users)
        .set({
          name: hit.name && hit.name !== name ? hit.name : name,
          passwordHash: hashPassword(password),
          role: hit.role,
        })
        .where(eq(users.id, hit.id))
        .returning();
      const token = issueToken(row.id);
      return NextResponse.json({
        ok: true,
        user: publicUser(row),
        token,
        redirect: body.next || "/account",
        claimed: true,
      });
    }

    const [row] = await db
      .insert(users)
      .values({ name, mobile, role: "owner", passwordHash: hashPassword(password) })
      .returning();
    const token = issueToken(row.id);
    return NextResponse.json({ ok: true, user: publicUser(row), token, redirect: body.next || "/" });
  }

  if (action === "login") {
    const rows = await db.select().from(users).where(eq(users.mobile, mobile)).limit(1);
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "Wrong mobile number or password." }, { status: 401 });
    }
    if (!user.passwordHash) {
      return NextResponse.json(
        {
          error:
            'This number posted a listing without a password. Tap "Create account" to set one — it will link to your existing lots.',
        },
        { status: 409 },
      );
    }
    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Wrong mobile number or password." }, { status: 401 });
    }
    if (user.blocked) {
      return NextResponse.json({ error: "This account has been blocked." }, { status: 403 });
    }
    const token = issueToken(user.id);
    return NextResponse.json({ ok: true, user: publicUser(user), token, redirect: body.next || "/" });
  }

  const current = await getSessionUser();
  if (current) return NextResponse.json({ ok: true, user: publicUser(current) });

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
