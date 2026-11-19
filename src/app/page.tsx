import { eq, inArray } from "drizzle-orm";
import { HomeClient } from "@/components/home-client";
import { db } from "@/db";
import { favorites, listings, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ensureSeed } from "@/db/seed";
import { TYPE_LABEL } from "@/lib/format";
import type { Lot, Seller } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeed();

  const session = await getSessionUser();

  const rows = await db.select().from(listings);
  const live = rows
    .filter((l) => l.status === "live")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const ownerIds = [...new Set(live.map((l) => l.ownerId))];
  const owners = ownerIds.length
    ? await db.select().from(users).where(inArray(users.id, ownerIds))
    : [];

  const sellers: Seller[] = owners
    .map((u) => {
      const mine = live.filter((l) => l.ownerId === u.id);
      if (!mine.length) return null;
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        city: u.city,
        mobile: u.mobile,
        liveCount: mine.length,
        lots: [...new Set(mine.map((l) => TYPE_LABEL[l.type] ?? "Lot"))],
      };
    })
    .filter((s): s is Seller => s !== null)
    .sort((a, b) => b.liveCount - a.liveCount);

  const favs = session
    ? (await db.select().from(favorites).where(eq(favorites.userId, session.id))).map((f) => f.listingId)
    : [];

  const lots: Lot[] = live.map((l) => ({
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
  }));

  return <HomeClient lots={lots} sellers={sellers} favs={favs} logged={!!session} />;
}
