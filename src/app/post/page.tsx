import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { PostWizard } from "@/components/post-wizard";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import { listings } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import type { Lot } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Post a property" };

type Search = { searchParams: Promise<{ edit?: string }> };

export default async function PostPage({ searchParams }: Search) {
  const sp = await searchParams;
  const session = await getSessionUser();
  const user = session
    ? {
        name: session.name,
        mobile: session.mobile,
        city: session.city,
        role: session.role,
      }
    : null;

  let initial: Lot | null = null;
  if (sp.edit) {
    if (!session) redirect("/login?next=/post");
    await ensureSeed();
    const id = Number(sp.edit);
    const rows = Number.isFinite(id)
      ? await db.select().from(listings).where(eq(listings.id, id)).limit(1)
      : [];
    const row = rows[0];
    if (!row) redirect("/account");
    if (session?.role !== "admin" && row.ownerId !== session?.id) redirect("/account");
    initial = {
      id: row.id,
      lot: row.lot,
      ownerId: row.ownerId,
      status: row.status,
      type: row.type,
      name: row.name,
      number: row.number,
      address: row.address,
      city: row.city,
      locality: row.locality,
      description: row.description,
      sqft: row.sqft,
      areaValue: row.areaValue,
      areaUnit: row.areaUnit,
      price: row.price,
      pricePerSqft: row.pricePerSqft,
      negotiable: row.negotiable,
      possessionFrom: row.possessionFrom,
      aboutProperty: row.aboutProperty,
      ownership: row.ownership,
      photos: (row.photos as string[]) ?? [],
      createdAt: row.createdAt.toISOString(),
    };
  }

  return <PostWizard logged={!!session} user={user} initial={initial} />;
}
