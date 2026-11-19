import { asc, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminConsole } from "@/components/admin-console";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import { enquiries, listings, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import type { Lot } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin console" };

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

export default async function AdminPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "admin") redirect("/account");

  await ensureSeed();

  const [all, accountRows, enqRows, allUsers] = await Promise.all([
    db.select().from(listings).orderBy(desc(listings.createdAt)),
    db.select().from(users).orderBy(asc(users.joinedAt)),
    db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(30),
    db.select().from(users),
  ]);

  const lots = all.map(toLot);

  const accounts = accountRows.map((u) => ({
    id: u.id,
    name: u.name,
    mobile: u.mobile,
    role: u.role,
    city: u.city,
    blocked: u.blocked,
    joinedAt: u.joinedAt.toISOString(),
    listingCount: all.filter((l) => l.ownerId === u.id).length,
  }));

  const feed = enqRows.map((e) => {
    const u = e.userId ? allUsers.find((x) => x.id === e.userId) : null;
    const l = all.find((x) => x.id === e.listingId);
    return {
      id: e.id,
      kind: e.kind,
      createdAt: e.createdAt.toISOString(),
      user: u ? { id: u.id, name: u.name, mobile: u.mobile, role: u.role } : null,
      listing: l
        ? {
            id: l.id,
            lot: l.lot,
            title: l.locality || l.city || l.address.split(",")[0],
            sqft: l.sqft,
            ownerId: l.ownerId,
          }
        : null,
    };
  });

  return <AdminConsole lots={lots} accounts={accounts} feed={feed} operator={session.name} />;
}
