CREATE TYPE "public"."gateway_check_status" AS ENUM('passed', 'failed', 'blocked');--> statement-breakpoint
CREATE TABLE "gateway_checks" (
	"gateway" "payment_gateway" PRIMARY KEY NOT NULL,
	"status" "gateway_check_status" NOT NULL,
	"mode" text NOT NULL,
	"detail" text NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
