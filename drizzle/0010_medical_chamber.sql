CREATE TABLE "donation_goal_updates" (
	"id" text PRIMARY KEY NOT NULL,
	"goal_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "donation_goal_updates" ADD CONSTRAINT "donation_goal_updates_goal_id_donation_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."donation_goals"("id") ON DELETE cascade ON UPDATE no action;