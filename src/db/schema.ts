import {
  bigint,
  bigserial,
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    mobile: varchar("mobile", { length: 15 }).notNull().unique(),
    passwordHash: text("password_hash"),
    role: varchar("role", { length: 16 }).notNull().default("owner"),
    provider: varchar("provider", { length: 16 }),
    city: text("city"),
    blocked: boolean("blocked").notNull().default(false),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("users_role_idx").on(t.role)],
);

export const listings = pgTable(
  "listings",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    lot: varchar("lot", { length: 8 }).notNull(),
    ownerId: bigint("owner_id", { mode: "number" }).notNull(),
    status: varchar("status", { length: 12 }).notNull().default("pending"),
    type: varchar("type", { length: 12 }).notNull().default("warehouse"),
    name: text("name").notNull(),
    number: varchar("number", { length: 15 }).notNull(),
    address: text("address").notNull(),
    city: text("city"),
    locality: text("locality"),
    description: text("description")
      .notNull()
      .default(""),
    sqft: integer("sqft").notNull().default(0),
    areaValue: doublePrecision("area_value"),
    areaUnit: varchar("area_unit", { length: 12 }).notNull().default("sqft"),
    price: bigint("price", { mode: "number" }),
    pricePerSqft: integer("price_per_sqft"),
    negotiable: boolean("negotiable").notNull().default(false),
    possessionFrom: varchar("possession_from", { length: 40 }),
    aboutProperty: varchar("about_property", { length: 60 }),
    ownership: varchar("ownership", { length: 40 }),
    photos: jsonb("photos")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("listings_status_idx").on(t.status), index("listings_owner_idx").on(t.ownerId)],
);

export const enquiries = pgTable(
  "enquiries",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    listingId: bigint("listing_id", { mode: "number" }).notNull(),
    userId: bigint("user_id", { mode: "number" }),
    kind: varchar("kind", { length: 16 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("enquiries_listing_idx").on(t.listingId)],
);

export const favorites = pgTable(
  "favorites",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" }).notNull(),
    listingId: bigint("listing_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("favorites_user_listing_idx").on(t.userId, t.listingId)],
);

export type User = typeof users.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
