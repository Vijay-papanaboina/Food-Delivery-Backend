CREATE TABLE "notification_svc"."notifications" (
	"notification_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"topic" text,
	"event_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"read" boolean DEFAULT false,
	"read_at" timestamp with time zone,
	"should_show_toast" boolean DEFAULT true
);
