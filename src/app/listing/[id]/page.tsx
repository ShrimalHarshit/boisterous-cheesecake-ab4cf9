import { eq, ne } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailClient } from "@/components/detail-client";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import { favorites, listings, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import type { Lot } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function load(id: number) {
  await ensureSeed();
  const rows = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  return rows[0] ?? null;
}

function toLot(l: typeof listings.$inferSelect): Lot {
  return {
    id: l.id,
    lot: l.lot,
    ownerId: l.ownerId,
    status: l.status,
    type: l.type,
    name: l.name,
    number: l.number,
    address: l.address,
    city: l.city,
    locality: l.locality,
    description: l.description,
    sqft: l.sqft,
    areaValue: l.areaValue,
    areaUnit: l.areaUnit,
    price: l.price,
    pricePerSqft: l.pricePerSqft,
    negotiable: l.negotiable,
    possessionFrom: l.possessionFrom,
    aboutProperty: l.aboutProperty,
    ownership: l.ownership,
    photos: (l.photos as string[]) ?? [],
    createdAt: l.createdAt.toISOString(),
  };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return { title: "Lot not found" };
  const l = await load(id);
  if (!l) return { title: "Lot not found" };
  return {
    title: `${l.locality || l.city || "Lot"} — ${l.sqft.toLocaleString("en-IN")} sq ft`,
    description: l.description.slice(0, 180),
  };
}

export default async function ListingPage({ params }: Params) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) notFound();

  const session = await getSessionUser();
  const row = await load(id);
  if (!row) notFound();

  const canView =
    row.status === "live" ||
    (session && (session.role === "admin" || session.id === row.ownerId));
  if (!canView) notFound();

  const ownerRows = await db.select().from(users).where(eq(users.id, row.ownerId)).limit(1);
  const owner = ownerRows[0] ?? null;

  const seller = owner
    ? {
        id: owner.id,
        name: owner.name,
        role: owner.role,
        city: owner.city,
        mobile: owner.mobile,
        liveCount: 0,
        lots: [] as string[],
      }
    : null;

  if (seller) {
    const mine = await db
      .select()
      .from(listings)
      .where(eq(listings.ownerId, row.ownerId));
    seller.liveCount = mine.filter((m) => m.status === "live").length;
  }

  let fav = false;
  if (session) {
    const f = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, session.id));
    fav = f.some((x) => x.listingId === row.id);
  }

  const related = (
    await db
      .select()
      .from(listings)
      .where(ne(listings.id, row.id))
  )
    .filter((l) => l.status === "live" && l.city === row.city && l.type === row.type)
    .slice(0, 3)
    .map(toLot);

  const fallbackRelated =
    related.length >= 3
      ? related
      : (
          await db.select().from(listings)
        )
          .filter((l) => l.status === "live" && l.id !== row.id)
          .slice(0, 3)
          .map(toLot);

  return (
    <div className="pt-5">
      <DetailClient
        lot={toLot(row)}
        seller={seller}
        fav={fav}
        logged={!!session}
        canEdit={!!session && (session.role === "admin" || session.id === row.ownerId)}
        related={related.length ? related : fallbackRelated}
      />
    </div>
  );
}
