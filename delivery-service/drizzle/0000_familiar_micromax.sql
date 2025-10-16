CREATE SCHEMA "delivery_svc";
--> statement-breakpoint
CREATE TABLE "delivery_svc"."deliveries" (
	"delivery_id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"driver_id" text NOT NULL,
	"driver_name" text NOT NULL,
	"driver_phone" text NOT NULL,
	"vehicle" text NOT NULL,
	"license_plate" text NOT NULL,
	"delivery_address_json" jsonb NOT NULL,
	"status" text NOT NULL,
	"assigned_at" timestamp with time zone,
	"estimated_delivery_time" timestamp with time zone,
	"actual_delivery_time" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_svc"."drivers" (
	"driver_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"vehicle" text NOT NULL,
	"license_plate" text NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"current_location_lat" numeric(10, 8),
	"current_location_lng" numeric(11, 8),
	"rating" numeric(3, 2) DEFAULT '0.0' NOT NULL,
	"total_deliveries" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
