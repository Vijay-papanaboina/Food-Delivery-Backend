CREATE SCHEMA "payment_svc";
--> statement-breakpoint
CREATE TABLE "payment_svc"."payments" (
	"payment_id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"method" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text NOT NULL,
	"transaction_id" text,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
