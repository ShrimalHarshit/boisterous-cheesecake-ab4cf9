import { asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { enquiries, favorites, listings, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

const D = 86400000;
const N = Date.now();

type SeedUser = {
  id: number;
  name: string;
  mobile: string;
  role: string;
  city: string;
  days: number;
  pw?: string;
};

const SEED_USERS: SeedUser[] = [
  { id: 1, name: "WareHub Desk", mobile: "9999999999", role: "admin", city: "Nashik", days: 46, pw: "admin123" },
  { id: 2, name: "Rajesh Patil", mobile: "9822012345", role: "owner", city: "Nashik", days: 30, pw: "demo123" },
  { id: 3, name: "Sunita Deshmukh", mobile: "9890123456", role: "owner", city: "Nashik", days: 24, pw: "demo123" },
  { id: 4, name: "Amit Shah", mobile: "9767001122", role: "broker", city: "Thane", days: 19, pw: "demo123" },
  { id: 5, name: "Vikram Jadhav", mobile: "9922334455", role: "owner", city: "Pune", days: 14, pw: "demo123" },
  { id: 6, name: "Meera Kulkarni", mobile: "9823998877", role: "owner", city: "Nashik", days: 9, pw: "demo123" },
  { id: 7, name: "Priya Nair", mobile: "9811122233", role: "owner", city: "Pune", days: 4, pw: "demo123" },
  { id: 8, name: "Sandeep Rathod", mobile: "9730044556", role: "broker", city: "Pune", days: 2, pw: "demo123" },
];

type SeedListing = {
  id: number;
  ownerId: number;
  status: string;
  type: string;
  name: string;
  address: string;
  city: string;
  locality: string;
  description: string;
  sqft: number;
  price: number;
  photos: string[];
  days: number;
  possessionFrom: string;
  aboutProperty: string;
  ownership: string;
  negotiable: boolean;
};

const SEED_LISTINGS: SeedListing[] = [
  {
    id: 1,
    ownerId: 2,
    status: "live",
    type: "warehouse",
    name: "Rajesh Patil",
    address: "Plot 14, MIDC Ambad, Nashik, Maharashtra 422010",
    city: "Nashik",
    locality: "MIDC Ambad",
    description:
      "Ready-built RCC warehouse with 6 loading docks, 3-phase 450 KVA power and 40 ft internal clearance. Direct truck access from the main MIDC road, 11 km from the Samruddhi expressway ramp. Fire NOC in place, clear title, first owner.",
    sqft: 32000,
    price: 38400000,
    photos: ["/images/lot-docks.jpg", "/images/lot-shell.jpg", "/images/hero-yard.jpg"],
    days: 1,
    possessionFrom: "Ready to move",
    aboutProperty: "Warehousing & logistics",
    ownership: "Freehold",
    negotiable: true,
  },
  {
    id: 2,
    ownerId: 3,
    status: "live",
    type: "land",
    name: "Sunita Deshmukh",
    address: "Survey 88/2, Sinnar Industrial Zone, Sinnar, Nashik 422103",
    city: "Nashik",
    locality: "Sinnar Industrial Zone",
    description:
      "Open commercial land with clear title and no litigation. Corner plot with 60 ft road frontage on two sides, level ground, suitable for warehousing or light manufacturing. Fencing on three sides already complete.",
    sqft: 80000,
    price: 24000000,
    photos: ["/images/lot-plot.jpg", "/images/lot-aerial.jpg"],
    days: 2,
    possessionFrom: "Ready to move",
    aboutProperty: "Development land",
    ownership: "Freehold",
    negotiable: true,
  },
  {
    id: 3,
    ownerId: 4,
    status: "live",
    type: "warehouse",
    name: "Amit Shah",
    address: "Unit 7, Bhiwandi Logistics Park, Bhiwandi, Thane 421302",
    city: "Thane",
    locality: "Bhiwandi Logistics Park",
    description:
      "Grade-A warehouse with fire NOC, sprinkler network, 24x7 security and 42 bay truck parking. 12 ft dock levellers, FM2 flooring, 9.5 m clear height. Ideal for 3PL and e-commerce fulfilment.",
    sqft: 45000,
    price: 54000000,
    photos: ["/images/lot-shell.jpg", "/images/lot-docks.jpg"],
    days: 3,
    possessionFrom: "Ready to move",
    aboutProperty: "Warehousing & logistics",
    ownership: "Leasehold",
    negotiable: false,
  },
  {
    id: 4,
    ownerId: 5,
    status: "live",
    type: "land",
    name: "Vikram Jadhav",
    address: "Plot 22, Chakan Phase 2, Pune, Maharashtra 410501",
    city: "Pune",
    locality: "Chakan Phase 2",
    description:
      "Industrial plot 4 km from the Pune–Nashik expressway. Boundary wall complete, water and MPSECL power connection available at plot edge. MIDC-approved, single-owner, ready for construction.",
    sqft: 18000,
    price: 21600000,
    photos: ["/images/lot-aerial.jpg", "/images/lot-plot.jpg"],
    days: 4,
    possessionFrom: "Ready to move",
    aboutProperty: "Industrial use",
    ownership: "Freehold",
    negotiable: true,
  },
  {
    id: 5,
    ownerId: 6,
    status: "live",
    type: "warehouse",
    name: "Meera Kulkarni",
    address: "Survey 41, Igatpuri Highway Road, Igatpuri, Nashik 422403",
    city: "Nashik",
    locality: "Igatpuri Highway Road",
    description:
      "Compact godown with an office room, attached washroom and space for a weighbridge. Shutter opening suits a 32 ft truck. Suited to agri-commodity and fertiliser storage.",
    sqft: 9500,
    price: 7600000,
    photos: ["/images/lot-godown.jpg"],
    days: 5,
    possessionFrom: "Ready to move",
    aboutProperty: "Warehousing & logistics",
    ownership: "Freehold",
    negotiable: true,
  },
  {
    id: 6,
    ownerId: 7,
    status: "pending",
    type: "land",
    name: "Priya Nair",
    address: "Plot 3, Satpur MIDC, Nashik, Maharashtra 422007",
    city: "Nashik",
    locality: "Satpur MIDC",
    description:
      "Flat industrial plot on a 40 ft internal road, ready for construction. All utilities at the boundary, MIDC transfer clear. Kept vacant for 6 years, no encumbrance.",
    sqft: 12000,
    price: 9600000,
    photos: ["/images/lot-plot.jpg"],
    days: 0,
    possessionFrom: "Ready to move",
    aboutProperty: "Industrial use",
    ownership: "Leasehold",
    negotiable: false,
  },
  {
    id: 7,
    ownerId: 8,
    status: "live",
    type: "land",
    name: "Sandeep Rathod",
    address: "Survey 119, Osmanabad Growth Corridor, Osmanabad 413501",
    city: "Osmanabad",
    locality: "Growth Corridor",
    description:
      "Agricultural-to-industrial conversion applied and pending sanction. Straight-line frontage of 180 ft on the state highway, level black-cotton soil, bunded fields on all sides.",
    sqft: 54000,
    price: 13500000,
    photos: ["/images/lot-aerial.jpg", "/images/hero-yard.jpg"],
    days: 6,
    possessionFrom: "Within 3 months",
    aboutProperty: "Development land",
    ownership: "Freehold",
    negotiable: true,
  },
  {
    id: 8,
    ownerId: 2,
    status: "live",
    type: "warehouse",
    name: "Rajesh Patil",
    address: "Shed B, Talegaon MIDC, Pune, Maharashtra 410507",
    city: "Pune",
    locality: "Talegaon MIDC",
    description:
      "Steel portal shed with 60 ft span, insulated roofing and a 1,200 sq ft attached office block. Rear paved yard for container stacking, gated entry with weighbridge access.",
    sqft: 26000,
    price: 31000000,
    photos: ["/images/lot-shell.jpg", "/images/hero-yard.jpg"],
    days: 8,
    possessionFrom: "Ready to move",
    aboutProperty: "Warehousing & logistics",
    ownership: "Freehold",
    negotiable: true,
  },
  {
    id: 9,
    ownerId: 5,
    status: "rejected",
    type: "land",
    name: "Vikram Jadhav",
    address: "Near Old APMC Yard, Nashik Road, Nashik 422101",
    city: "Nashik",
    locality: "Nashik Road",
    description:
      "Corner parcel near the old APMC yard. Title documents submitted were incomplete, so this lot was held back from the index pending clarification.",
    sqft: 7200,
    price: 6300000,
    photos: ["/images/lot-plot.jpg"],
    days: 11,
    possessionFrom: "Ready to move",
    aboutProperty: "Investment holding",
    ownership: "GPA / Agreement",
    negotiable: true,
  },
];

let running: Promise<void> | null = null;

export function ensureSeed(): Promise<void> {
  if (!running) {
    running = doSeed().catch((e) => {
      running = null;
      throw e;
    });
  }
  return running;
}

/** Explicit seed ids leave the bigserial sequences behind — realign them. */
async function fixSequences(): Promise<void> {
  const tables = ["users", "listings", "enquiries", "favorites"];
  for (const t of tables) {
    await db.execute(
      sql`select setval(
        pg_get_serial_sequence(${t}, 'id'),
        coalesce((select max(id) from ${sql.raw(t)}), 1),
        (select exists(select 1 from ${sql.raw(t)}))
      )`,
    );
  }
}

async function doSeed(): Promise<void> {
  try {
    await seedOnce();
  } catch (err) {
    // A concurrent request may have seeded the same rows; only rethrow if
    // the database really is empty.
    const check = await db.select({ id: users.id }).from(users).limit(1).catch(() => [{ id: 1 }]);
    if (!check.length) throw err;
  }
  await fixSequences();
}

async function seedOnce(): Promise<void> {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length) return;

  await db.insert(users).values(
    SEED_USERS.map((u) => ({
      id: u.id,
      name: u.name,
      mobile: u.mobile,
      role: u.role,
      city: u.city,
      passwordHash: u.pw ? hashPassword(u.pw) : null,
      joinedAt: new Date(N - u.days * D),
    })),
  ).onConflictDoNothing();

  await db.insert(listings).values(
    SEED_LISTINGS.map((l) => ({
      id: l.id,
      lot: `WH-${100 + l.id}`,
      ownerId: l.ownerId,
      status: l.status,
      type: l.type,
      name: l.name,
      number: SEED_USERS.find((u) => u.id === l.ownerId)?.mobile ?? "9822012345",
      address: l.address,
      city: l.city,
      locality: l.locality,
      description: l.description,
      sqft: l.sqft,
      areaValue: l.sqft,
      areaUnit: "sqft",
      price: l.price,
      pricePerSqft: Math.round(l.price / l.sqft),
      negotiable: l.negotiable,
      possessionFrom: l.possessionFrom,
      aboutProperty: l.aboutProperty,
      ownership: l.ownership,
      photos: l.photos,
      createdAt: new Date(N - l.days * D),
    })),
  ).onConflictDoNothing();

  await db.insert(enquiries).values([
    { listingId: 1, userId: 7, kind: "phone", createdAt: new Date(N - 3600000) },
    { listingId: 3, userId: 6, kind: "chat", createdAt: new Date(N - 9000000) },
    { listingId: 2, userId: 5, kind: "call", createdAt: new Date(N - D) },
    { listingId: 4, userId: 3, kind: "phone", createdAt: new Date(N - 2 * D) },
  ]);

  await db.insert(favorites).values([
    { userId: 7, listingId: 1 },
    { userId: 7, listingId: 4 },
  ]).onConflictDoNothing();
}

/** Returns every listing ordered newest first (after guaranteeing seed data). */
export async function loadListings() {
  await ensureSeed();
  return db.select().from(listings).orderBy(asc(listings.createdAt));
}
