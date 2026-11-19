import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountListings, LogoutButton } from "@/components/account-listings";
import { Icon, Mark } from "@/components/icons";
import { db } from "@/db";
import { ensureSeed } from "@/db/seed";
import { favorites, listings } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { fmt, ROLE_LABEL } from "@/lib/format";
import type { Lot } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your account" };

export default async function AccountPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login?next=/account");

  await ensureSeed();

  const all = await db.select().from(listings);
  const mine = all
    .filter((l) => l.ownerId === session.id)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const favRows = await db.select().from(favorites).where(eq(favorites.userId, session.id));

  const count = (s: string) => mine.filter((l) => l.status === s).length;
  const totalArea = mine.reduce((a, l) => a + l.sqft, 0);

  const lots: Lot[] = mine.map((l) => ({
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

  const isAdmin = session.role === "admin";

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <div className="sec-head">
        <span className="cap">Account sheet</span>
        <span className="mono">
          {isAdmin ? "desk operator" : `ID ${String(session.id).padStart(4, "0")}`}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:gap-10">
        {/* identity plate */}
        <aside className="lg:sticky lg:top-[86px] lg:self-start">
          <div className="border-[1.5px] border-ink bg-card">
            <div className="flex items-center gap-3 border-b-[1.5px] border-ink p-4">
              <span className="num grid h-14 w-14 shrink-0 place-items-center border-[1.5px] border-ink bg-panel text-[24px] font-black">
                {session.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[17px] font-bold leading-tight">{session.name}</p>
                <p className="mono truncate text-[11.5px] text-mute">+91 {session.mobile}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2">
              {[
                ["Role", ROLE_LABEL[session.role] ?? session.role],
                ["City", session.city ?? "—"],
                ["Saved", String(favRows.length)],
                [
                  "Joined",
                  session.joinedAt.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }),
                ],
              ].map(([k, v], i) => (
                <div key={k} className={`border-line p-3.5 ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b" : ""}`}>
                  <dt className="cap text-[9px] text-mute">{k}</dt>
                  <dd className="mt-1.5 text-[14px] font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex gap-2 border-t-[1.5px] border-ink p-3">
              <Link href="/post" className="btn sm flex-1">
                <Icon name="plus" className="h-4 w-4" />
                New lot
              </Link>
              <div className="flex-1">
                <LogoutButton />
              </div>
            </div>
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              className="mt-4 flex items-center justify-between border-[1.5px] border-oxide bg-[color-mix(in_srgb,var(--c-oxide)_9%,transparent)] p-4 transition-colors hover:bg-oxide hover:text-white"
            >
              <span>
                <span className="cap block">Admin console</span>
                <span className="mono text-[11.5px] text-mute">
                  moderation, accounts &amp; enquiries
                </span>
              </span>
              <Icon name="arrow" className="h-5 w-5" />
            </Link>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              ["Live", count("live"), "text-survey"],
              ["In review", count("pending"), "text-oxide"],
              ["Unlisted", count("rejected"), "text-mute"],
              ["Saved", favRows.length, ""],
            ].map(([k, v, tone]) => (
              <div key={k as string} className="border border-line bg-card p-3">
                <p className={`num text-[26px] font-black leading-none ${tone as string}`}>{v as number}</p>
                <p className="cap mt-1.5 text-[9px] text-mute">{k as string}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* listings */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3 border-t-[1.5px] border-ink pt-3">
            <h1 className="text-[clamp(28px,5vw,44px)]">
              My lots,{" "}
              <span className="font-serif font-normal italic text-oxide">
                {String(mine.length).padStart(2, "0")}
              </span>
            </h1>
            <p className="mono text-[11.5px] uppercase tracking-[0.12em] text-mute">
              {fmt(totalArea)} sq ft total under management
            </p>
          </div>

          <div className="mt-5">
            <AccountListings lots={lots} admin={isAdmin} />
          </div>

          {mine.length === 0 && (
            <div className="hatch mt-4 grid place-items-center gap-3 border-[1.5px] border-ink px-6 py-14 text-center">
              <Mark className="h-12 w-12 text-ink" />
              <p className="font-bold">You haven&apos;t listed anything yet.</p>
              <p className="max-w-[46ch] text-[14px] text-ink2">
                Fill the property sheet once — it takes about three minutes — and our desk reviews it
                within 24 hours.
              </p>
              <Link href="/post" className="btn oxide">
                Post your first lot
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


