import { asc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { listings, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getSessionUser();
  if (!session) return null;
  if (session.role !== "admin") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      mobile: users.mobile,
      role: users.role,
      provider: users.provider,
      city: users.city,
      blocked: users.blocked,
      joinedAt: users.joinedAt,
      listingCount: sql<number>`count(${listings.id})::int`,
    })
    .from(users)
    .leftJoin(listings, eq(listings.ownerId, users.id))
    .groupBy(users.id)
    .orderBy(asc(users.joinedAt));

  return NextResponse.json({ users: rows });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Missing user." }, { status: 400 });

  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const user = rows[0];
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (user.role === "admin") {
    return NextResponse.json({ error: "Cannot block an admin." }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set({ blocked: !user.blocked })
    .where(eq(users.id, id))
    .returning();

  return NextResponse.json({ ok: true, blocked: updated.blocked });
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Missing user." }, { status: 400 });

  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const user = rows[0];
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (user.role === "admin") {
    return NextResponse.json({ error: "Cannot delete an admin." }, { status: 400 });
  }

  await db.delete(listings).where(eq(listings.ownerId, id));
  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ ok: true });
}


