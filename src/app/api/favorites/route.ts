import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "login" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const listingId = Number(b.listingId);
  if (!Number.isFinite(listingId)) {
    return NextResponse.json({ error: "Missing listing." }, { status: 400 });
  }

  const key = and(eq(favorites.userId, session.id), eq(favorites.listingId, listingId));
  const existing = await db.select().from(favorites).where(key).limit(1);

  if (existing.length) {
    await db.delete(favorites).where(key);
    return NextResponse.json({ ok: true, fav: false });
  }

  await db.insert(favorites).values({ userId: session.id, listingId });
  return NextResponse.json({ ok: true, fav: true });
}
