import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ALLOWED = ["pending", "live", "rejected"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const id = Number((await params).id);
  const b = await req.json().catch(() => ({}));
  const status = String(b.status || "");
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  }

  const rows = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  if (!rows[0]) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const [updated] = await db
    .update(listings)
    .set({ status })
    .where(eq(listings.id, id))
    .returning();

  return NextResponse.json({ ok: true, listing: updated });
}
