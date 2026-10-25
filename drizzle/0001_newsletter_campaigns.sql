CREATE TYPE "public"."campaign_status" AS ENUM('sending', 'sent', 'failed');
--> statement-breakpoint
CREATE TABLE "newsletter_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"status" "campaign_status" DEFAULT 'sending' NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "newsletter_campaigns" ADD CONSTRAINT "newsletter_campaigns_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "newsletter_campaigns_created_idx" ON "newsletter_campaigns" USING btree ("created_at");
--> statement-breakpoint
-- Catch-up columns that were in the schema but missing from the first migration.
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "base_rsvp_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "subject" text;
--> statement-breakpoint
UPDATE "support_tickets" SET "subject" = left("message", 120) WHERE "subject" IS NULL;
--> statement-breakpoint
ALTER TABLE "support_tickets" ALTER COLUMN "subject" SET NOT NULL;
