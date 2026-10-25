CREATE TYPE "public"."alumni_source" AS ENUM('self_registered', 'csv_import');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."donation_status" AS ENUM('pending', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."event_mode" AS ENUM('in_person', 'online', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('upcoming', 'past');--> statement-breakpoint
CREATE TYPE "public"."helpdesk_topic" AS ENUM('account', 'profile_verification', 'donation_receipt', 'general');--> statement-breakpoint
CREATE TYPE "public"."member_post_type" AS ENUM('story', 'achievement', 'notice', 'in_memoriam');--> statement-breakpoint
CREATE TYPE "public"."newsletter_interest" AS ENUM('news', 'events', 'giving', 'stories');--> statement-breakpoint
CREATE TYPE "public"."payment_gateway" AS ENUM('esewa', 'khalti', 'connectips', 'fonepay', 'card', 'paypal');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('esewa', 'khalti', 'connectips', 'fonepay', 'card', 'paypal');--> statement-breakpoint
CREATE TYPE "public"."post_type" AS ENUM('news', 'story', 'notice', 'achievement', 'event', 'announcement', 'in_memoriam');--> statement-breakpoint
CREATE TYPE "public"."programme" AS ENUM('MBBS', 'BDS', 'BMIT', 'BSc Nursing', 'Allied Health', 'MD/MS', 'MSc', 'MDS', 'DM/MCh', 'PhD', 'Fellowship');--> statement-breakpoint
CREATE TYPE "public"."recipient_kind" AS ENUM('batch', 'mentor', 'alumnus');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('inappropriate', 'inaccurate', 'spam', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'reviewed', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('confirmed', 'waitlist');--> statement-breakpoint
CREATE TYPE "public"."subscriber_status" AS ENUM('subscribed', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'in_progress', 'closed');--> statement-breakpoint
CREATE TYPE "public"."tribute_type" AS ENUM('in_honour', 'in_memory');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('donor', 'alumni', 'admin');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('public', 'alumni_only', 'hidden');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alumni" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"programme" "programme" NOT NULL,
	"batch_year" integer NOT NULL,
	"further_studies" text,
	"current_position" text,
	"organisation" text,
	"city" text,
	"country" text NOT NULL,
	"note" text,
	"photo_url" text,
	"privacy_email" "visibility" DEFAULT 'hidden' NOT NULL,
	"privacy_phone" "visibility" DEFAULT 'hidden' NOT NULL,
	"privacy_profile" "visibility" DEFAULT 'public' NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"source" "alumni_source" DEFAULT 'self_registered' NOT NULL,
	"placeholder" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" text,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_members" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"term" text NOT NULL,
	"batch" text,
	"photo_url" text,
	"bio" text,
	"vision_statement" text,
	"is_current" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"placeholder" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donation_goals" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"target_minor" bigint NOT NULL,
	"raised_minor" bigint DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'NPR' NOT NULL,
	"deadline" timestamp with time zone,
	"image_url" text,
	"placeholder" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"goal_id" text,
	"event_id" text,
	"amount_minor" bigint NOT NULL,
	"currency" text DEFAULT 'NPR' NOT NULL,
	"method" "payment_method" NOT NULL,
	"status" "donation_status" DEFAULT 'pending' NOT NULL,
	"anonymous" boolean DEFAULT false NOT NULL,
	"tribute" jsonb,
	"gateway" "payment_gateway",
	"gateway_ref" text,
	"gateway_payload" jsonb,
	"receipt_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_rsvps" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"guests" integer DEFAULT 1 NOT NULL,
	"status" "rsvp_status" DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"description" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"venue" text NOT NULL,
	"city" text NOT NULL,
	"mode" "event_mode" DEFAULT 'in_person' NOT NULL,
	"capacity" integer,
	"image_url" text,
	"status" "event_status" DEFAULT 'upcoming' NOT NULL,
	"goal_id" text,
	"gallery" jsonb,
	"placeholder" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faq_items" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"placeholder" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "post_type" NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"body" text NOT NULL,
	"author" text NOT NULL,
	"author_email" text,
	"published_at" timestamp with time zone,
	"image_url" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"placeholder" boolean DEFAULT false NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funds_breakdown" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"share_percent" integer NOT NULL,
	"period" text DEFAULT 'current' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"interests" "newsletter_interest"[] DEFAULT '{}'::newsletter_interest[] NOT NULL,
	"status" "subscriber_status" DEFAULT 'subscribed' NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"donation_id" text,
	"gateway" "payment_gateway" NOT NULL,
	"event_type" text NOT NULL,
	"external_id" text,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"reason" "report_reason" NOT NULL,
	"details" text,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"topic" "helpdesk_topic" NOT NULL,
	"message" text NOT NULL,
	"status" "ticket_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'donor' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "welcome_message" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"author" text NOT NULL,
	"role" text NOT NULL,
	"text" text NOT NULL,
	"video_url" text,
	"photo_url" text,
	"placeholder" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alumni" ADD CONSTRAINT "alumni_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alumni" ADD CONSTRAINT "alumni_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_goal_id_donation_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."donation_goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_goal_id_donation_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."donation_goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_post_id_feed_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."feed_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_audit_created_idx" ON "admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "alumni_status_idx" ON "alumni" USING btree ("status");--> statement-breakpoint
CREATE INDEX "alumni_programme_idx" ON "alumni" USING btree ("programme");--> statement-breakpoint
CREATE INDEX "alumni_batch_year_idx" ON "alumni" USING btree ("batch_year");--> statement-breakpoint
CREATE INDEX "alumni_country_idx" ON "alumni" USING btree ("country");--> statement-breakpoint
CREATE INDEX "alumni_name_idx" ON "alumni" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "donations_user_idx" ON "donations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "donations_goal_idx" ON "donations" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "donations_status_idx" ON "donations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "donations_created_idx" ON "donations" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "donations_gateway_ref_unique" ON "donations" USING btree ("gateway","gateway_ref");--> statement-breakpoint
CREATE INDEX "event_rsvps_event_idx" ON "event_rsvps" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_rsvps_event_email_unique" ON "event_rsvps" USING btree ("event_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_unique" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "feed_posts_status_idx" ON "feed_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feed_posts_type_idx" ON "feed_posts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "feed_posts_published_idx" ON "feed_posts" USING btree ("published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_email_unique" ON "newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_token_unique" ON "newsletter_subscribers" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_events_gateway_external_unique" ON "payment_events" USING btree ("gateway","external_id");--> statement-breakpoint
CREATE INDEX "payment_events_donation_idx" ON "payment_events" USING btree ("donation_id");--> statement-breakpoint
CREATE INDEX "post_reports_status_idx" ON "post_reports" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_unique" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "support_tickets_reference_unique" ON "support_tickets" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "support_tickets_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");