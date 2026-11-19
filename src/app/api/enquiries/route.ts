import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { enquiries, listings } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const KINDS = ["phone", "chat", "call", "map", "save"];

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const listingId = Number(b.listingId);
  const kind = KINDS.includes(String(b.kind)) ? String(b.kind) : "phone";

  if (!Number.isFinite(listingId)) {
    return NextResponse.json({ error: "Missing listing." }, { status: 400 });
  }

  const rows = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!rows[0]) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const session = await getSessionUser();
  await db.insert(enquiries).values({ listingId, kind, userId: session?.id ?? null });

  return NextResponse.json({ ok: true, number: rows[0].number });
}
