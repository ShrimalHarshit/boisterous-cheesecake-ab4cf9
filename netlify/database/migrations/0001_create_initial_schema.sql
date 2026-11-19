CREATE TABLE "enquiries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"listing_id" bigint NOT NULL,
	"user_id" bigint,
	"kind" varchar(16) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"listing_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"lot" varchar(8) NOT NULL,
	"owner_id" bigint NOT NULL,
	"status" varchar(12) DEFAULT 'pending' NOT NULL,
	"type" varchar(12) DEFAULT 'warehouse' NOT NULL,
	"name" text NOT NULL,
	"number" varchar(15) NOT NULL,
	"address" text NOT NULL,
	"city" text,
	"locality" text,
	"description" text DEFAULT '' NOT NULL,
	"sqft" integer DEFAULT 0 NOT NULL,
	"area_value" double precision,
	"area_unit" varchar(12) DEFAULT 'sqft' NOT NULL,
	"price" bigint,
	"price_per_sqft" integer,
	"negotiable" boolean DEFAULT false NOT NULL,
	"possession_from" varchar(40),
	"about_property" varchar(60),
	"ownership" varchar(40),
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"mobile" varchar(15) NOT NULL,
	"password_hash" text,
	"role" varchar(16) DEFAULT 'owner' NOT NULL,
	"provider" varchar(16),
	"city" text,
	"blocked" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_mobile_unique" UNIQUE("mobile")
);
--> statement-breakpoint
CREATE INDEX "enquiries_listing_idx" ON "enquiries" USING btree ("listing_id");--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_listing_idx" ON "favorites" USING btree ("user_id","listing_id");--> statement-breakpoint
CREATE INDEX "listings_status_idx" ON "listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "listings_owner_idx" ON "listings" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");