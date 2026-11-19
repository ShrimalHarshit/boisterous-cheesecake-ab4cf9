import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { LotCard } from "@/components/listing-card";
import { Icon } from "@/components/icons";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import { favorites, listings } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import type { Lot } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Saved lots" };

export default async function FavoritesPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/favorites");

  await ensureSeed();

  const favRows = await db
    .select()
    .from(favorites)
    .where(eq(favorites.userId, session.id));

  const ids = favRows.map((f) => f.listingId);
  const all = await db.select().from(listings);
  const rows = all
    .filter((l) => ids.includes(l.id) && l.status === "live")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());


  const lots: Lot[] = rows.map((l) => ({
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

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <div className="sec-head">
        <span className="cap">Saved lots</span>
        <span className="mono">{String(lots.length).padStart(2, "0")} kept</span>
      </div>

      <h1 className="text-[clamp(32px,6vw,58px)]">
        Your shortlist,{" "}
        <span className="font-serif font-normal italic text-oxide">in one sheet.</span>
      </h1>
      <p className="mt-3 max-w-[58ch] text-[15px] text-ink2">
        Hearts you&apos;ve tapped across the index. Un-heart a lot here or on its page and it drops
        off this list straight away.
      </p>

      {lots.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {lots.map((l, i) => (
            <LotCard key={l.id} lot={l} index={i} fav logged />
          ))}
        </div>
      ) : (
        <div className="hatch mt-8 grid place-items-center gap-3 border-[1.5px] border-ink px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full border-[1.5px] border-ink bg-paper">
            <Icon name="heart" className="h-5 w-5" />
          </span>
          <p className="font-bold">Nothing saved yet.</p>
          <p className="max-w-[44ch] text-[14px] text-ink2">
            Tap the heart on any lot in the index and it will wait for you here.
          </p>
          <a href="/" className="btn">
            Open the lot index
          </a>
        </div>
      )}
    </div>
  );
}
