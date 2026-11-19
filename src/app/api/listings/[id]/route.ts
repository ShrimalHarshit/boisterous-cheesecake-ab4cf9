import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { VALID_MOBILE, toSqft } from "@/lib/format";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const id = Number((await params).id);
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Log in first." }, { status: 401 });

  const rows = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const isAdmin = session.role === "admin";
  if (!isAdmin && row.ownerId !== session.id) {
    return NextResponse.json({ error: "Not your listing." }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const patch: Partial<typeof listings.$inferInsert> = {};

  if (typeof b.name === "string" && b.name.trim().length > 1) patch.name = b.name.trim();
  if (typeof b.address === "string" && b.address.trim().length > 5) patch.address = b.address.trim();
  if (typeof b.description === "string" && b.description.trim().length >= 15)
    patch.description = b.description.trim();
  if (typeof b.city === "string") patch.city = b.city.trim() || null;
  if (typeof b.locality === "string") patch.locality = b.locality.trim() || null;
  if (b.type === "land" || b.type === "warehouse") patch.type = b.type;
  if (b.number !== undefined) {
    const n = String(b.number).replace(/\D/g, "").slice(-10);
    if (!VALID_MOBILE.test(n)) return NextResponse.json({ error: "Invalid number." }, { status: 400 });
    patch.number = n;
  }
  if (b.areaValue !== undefined) {
    const v = Number(b.areaValue);
    const unit = String(b.areaUnit || row.areaUnit);
    if (!Number.isFinite(v) || v <= 0) {
      return NextResponse.json({ error: "Enter the area in numbers." }, { status: 400 });
    }
    patch.areaValue = v;
    patch.areaUnit = unit;
    patch.sqft = toSqft(v, unit);
  }
  if (b.price !== undefined) {
    const p = Number(b.price);
    patch.price = p > 0 ? Math.round(p) : null;
    const sqft = patch.sqft ?? row.sqft;
    patch.pricePerSqft = patch.price ? Math.round(patch.price / Math.max(1, sqft)) : null;
  }
  if (typeof b.negotiable === "boolean") patch.negotiable = b.negotiable;
  if (typeof b.possessionFrom === "string") patch.possessionFrom = b.possessionFrom || null;
  if (typeof b.aboutProperty === "string") patch.aboutProperty = b.aboutProperty || null;
  if (typeof b.ownership === "string") patch.ownership = b.ownership || null;
  if (Array.isArray(b.photos))
    patch.photos = b.photos.filter((p: unknown) => typeof p === "string").slice(0, 6);

  // Any owner edit re-enters the review queue; admins keep it live.
  if (!isAdmin && row.status === "live") patch.status = "pending";

  const [updated] = await db.update(listings).set(patch).where(eq(listings.id, id)).returning();
  return NextResponse.json({ ok: true, listing: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const id = Number((await params).id);
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Log in first." }, { status: 401 });

  const rows = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  if (session.role !== "admin" && row.ownerId !== session.id) {
    return NextResponse.json({ error: "Not your listing." }, { status: 403 });
  }

  await db.delete(listings).where(eq(listings.id, id));
  return NextResponse.json({ ok: true });
}
