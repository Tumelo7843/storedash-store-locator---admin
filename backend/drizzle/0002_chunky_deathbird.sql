CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
-- Backfill existing rows as 'approved' (they were already live before this
-- column existed), then flip the column default to 'pending' for everything
-- inserted from here on. Application code always sets approvalStatus
-- explicitly on insert anyway (see stores/products/storeServices controllers)
-- — the 'pending' default is a fail-closed safety net, not the primary path.
ALTER TABLE "products" ADD COLUMN "approval_status" "approval_status" DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "approval_status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "reviewed_by" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "approval_status" "approval_status" DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "approval_status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "reviewed_by" integer;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "approval_status" "approval_status" DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "approval_status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "reviewed_by" integer;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
