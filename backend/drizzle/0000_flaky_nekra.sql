CREATE TYPE "public"."order_status" AS ENUM('pending', 'processing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."store_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'store_admin', 'super_admin');--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer,
	"product_name" text NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"line_total" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"name" text NOT NULL,
	"sku" text NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"brand" text,
	"price" numeric(10, 2) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"image_url" text,
	"description" text,
	"unit" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_store_sku_unique" UNIQUE("store_id","sku")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"duration_minutes" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"image_url" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"store_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_admins_user_store_unique" UNIQUE("user_id","store_id")
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'General' NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text DEFAULT 'United States' NOT NULL,
	"lat" numeric(10, 7),
	"lng" numeric(10, 7),
	"phone" text,
	"email" text,
	"image_url" text,
	"banner_url" text,
	"status" "store_status" DEFAULT 'active' NOT NULL,
	"delivery_available" boolean DEFAULT false NOT NULL,
	"pickup_available" boolean DEFAULT true NOT NULL,
	"opening_hours" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_admins" ADD CONSTRAINT "store_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_admins" ADD CONSTRAINT "store_admins_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_store_id_idx" ON "orders" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "services_store_id_idx" ON "services" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "store_admins_store_id_idx" ON "store_admins" USING btree ("store_id");