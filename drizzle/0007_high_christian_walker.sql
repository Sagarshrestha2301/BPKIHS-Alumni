ALTER TABLE "donations" ADD COLUMN "succeeded_at" timestamp with time zone;--> statement-breakpoint
-- Backfill from updated_at: completeDonation() writes the status and updated_at together, so
-- for rows confirmed before this column existed that is the best available confirmation time.
-- Without this the monthly giving chart would show no history for existing gifts.
UPDATE "donations" SET "succeeded_at" = "updated_at" WHERE "status" = 'succeeded' AND "succeeded_at" IS NULL;--> statement-breakpoint
CREATE INDEX "donations_succeeded_at_idx" ON "donations" USING btree ("status","succeeded_at");
