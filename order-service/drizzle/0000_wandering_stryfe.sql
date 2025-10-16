CREATE SCHEMA "order_svc";
--> statement-breakpoint
CREATE TABLE "order_svc"."orders" (
	"order_id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"items_json" jsonb NOT NULL,
	"delivery_address_json" jsonb NOT NULL,
	"status" text NOT NULL,
	"payment_status" text NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"delivered_at" timestamp with time zone
);
