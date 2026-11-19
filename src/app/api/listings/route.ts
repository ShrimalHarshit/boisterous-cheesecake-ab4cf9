import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { listings, users } from "@/db/schema";
import { ensureSeed } from "@/db/seed";
import { getSessionUser, issueToken } from "@/lib/auth";
import { VALID_MOBILE, toSqft } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(listings).orderBy(desc(listings.createdAt));
  return NextResponse.json({ listings: rows });
}

export async function POST(req: Request) {
  // Guarantees the id sequences are realigned before we insert anything.
  await ensureSeed();

  const b = await req.json().catch(() => ({}));
  const session = await getSessionUser();

  const mobile = String(b.number || "").replace(/\D/g, "").slice(-10);
  if (!VALID_MOBILE.test(mobile)) {
    return NextResponse.json({ error: "Enter a valid 10-digit contact number." }, { status: 400 });
  }

  let owner = session;

  // Guest path: the stepped wizard finishes by creating the account on the spot.
  if (!owner) {
    const name = String(b.name || "").trim();
    if (name.length < 2) {
      return NextResponse.json({ error: "Enter the contact name." }, { status: 400 });
    }
    const existing = await db.select().from(users).where(eq(users.mobile, mobile)).limit(1);
    const hit = existing[0];
    if (hit?.passwordHash) {
      return NextResponse.json(
        { error: "This number already has a password-protected account — log in to post." },
        { status: 409 },
      );
    }
    if (hit) {
      if (hit.blocked) {
        return NextResponse.json({ error: "This account has been blocked." }, { status: 403 });
      }
      owner = hit;
    } else {
      const [row] = await db
        .insert(users)
        .values({
          name,
          mobile,
          role: String(b.ownerRole || "") === "broker" ? "broker" : "owner",
          city: String(b.city || "").trim() || null,
          passwordHash: null,
        })
        .returning();
      owner = row;
    }
    // Don't set cookie via fetch — return token for callback redirect instead.
  }

  const name = String(b.name || owner.name).trim();
  const address = String(b.address || "").trim();
  const description = String(b.description || "").trim();
  const areaValue = Number(b.areaValue);
  const unit = String(b.areaUnit || "sqft");
  const sqft = toSqft(areaValue, unit);

  if (address.length < 5) {
    return NextResponse.json({ error: "Enter the full property address." }, { status: 400 });
  }
  if (description.length < 15) {
    return NextResponse.json(
      { error: "Add a short description of at least 15 characters." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(areaValue) || areaValue <= 0 || sqft <= 0) {
    return NextResponse.json({ error: "Enter the plot area in numbers." }, { status: 400 });
  }

  const price = Number(b.price) > 0 ? Math.round(Number(b.price)) : null;
  const status = owner.role === "admin" ? "live" : "pending";

  const [row] = await db
    .insert(listings)
    .values({
      lot: `WH-${String(Date.now()).slice(-4)}`,
      ownerId: owner.id,
      status,
      type: b.type === "land" ? "land" : "warehouse",
      name,
      number: mobile,
      address,
      city: String(b.city || "").trim() || null,
      locality: String(b.locality || "").trim() || null,
      description,
      sqft,
      areaValue: Number.isFinite(areaValue) ? areaValue : sqft,
      areaUnit: unit,
      price,
      pricePerSqft: price ? Math.round(price / sqft) : null,
      negotiable: !!b.negotiable,
      possessionFrom: String(b.possessionFrom || "") || null,
      aboutProperty: String(b.aboutProperty || "") || null,
      ownership: String(b.ownership || "") || null,
      photos: Array.isArray(b.photos) ? b.photos.filter((p: unknown) => typeof p === "string").slice(0, 6) : [],
    })
    .returning();

  const dest = owner.role === "admin" ? "/admin" : "/account";
  return NextResponse.json({
    ok: true,
    id: row.id,
    status,
    // For guest posts: the token lets the client navigate through /api/auth/callback
    // so the cookie is set on a full page navigation.
    token: issueToken(owner.id),
    redirect: dest,
  });
}
