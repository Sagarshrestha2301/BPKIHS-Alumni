-- The Prisma adapter requires an internal record ID in addition to Better Auth's key.
ALTER TABLE "RateLimit" ADD COLUMN "id" TEXT;

-- Keep this migration safe if a deployment has already recorded rate-limit rows.
UPDATE "RateLimit"
SET "id" = md5("key" || ':' || "lastRequest"::TEXT)
WHERE "id" IS NULL;

ALTER TABLE "RateLimit" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "RateLimit" DROP CONSTRAINT "RateLimit_pkey";
ALTER TABLE "RateLimit" ADD CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id");
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");
