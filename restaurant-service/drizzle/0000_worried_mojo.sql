CREATE SCHEMA "restaurant_svc";
--> statement-breakpoint
CREATE TABLE "restaurant_svc"."kitchen_orders" (
	"order_id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"items_json" jsonb NOT NULL,
	"delivery_address_json" jsonb NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"estimated_ready_time" timestamp with time zone,
	"ready_at" timestamp with time zone,
	"preparation_time" integer
);
--> statement-breakpoint
CREATE TABLE "restaurant_svc"."menu_items" (
	"item_id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"category" text NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"preparation_time" integer DEFAULT 15 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_svc"."restaurants" (
	"restaurant_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cuisine" text NOT NULL,
	"address" text NOT NULL,
	"phone" text NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0.0' NOT NULL,
	"delivery_time" text DEFAULT '30-40 min' NOT NULL,
	"delivery_fee" numeric(10, 2) DEFAULT '2.99' NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL,
	"opening_time" time,
	"closing_time" time,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
