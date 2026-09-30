-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PRIVATE', 'ALUMNI_ONLY', 'PUBLIC');

-- CreateEnum
CREATE TYPE "AlumniVerificationStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "admissionYear" INTEGER,
    "graduationYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlumniProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "programmeId" TEXT,
    "batchId" TEXT,
    "admissionYear" INTEGER,
    "graduationYear" INTEGER,
    "specialization" TEXT,
    "currentPosition" TEXT,
    "organization" TEXT,
    "city" TEXT,
    "country" TEXT,
    "furtherStudy" TEXT,
    "furtherStudyInstitution" TEXT,
    "biography" TEXT,
    "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "verificationStatus" "AlumniVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlumniProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlumniVerification" (
    "id" TEXT NOT NULL,
    "alumniProfileId" TEXT NOT NULL,
    "claimedProgrammeId" TEXT NOT NULL,
    "claimedBatchId" TEXT NOT NULL,
    "claimedAdmissionYear" INTEGER,
    "claimedGraduationYear" INTEGER,
    "status" "AlumniVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "decisionReason" TEXT,
    "reviewNotes" TEXT,

    CONSTRAINT "AlumniVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationAuditEvent" (
    "id" TEXT NOT NULL,
    "alumniVerificationId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "previousStatus" "AlumniVerificationStatus",
    "newStatus" "AlumniVerificationStatus" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");
CREATE UNIQUE INDEX "Programme_code_key" ON "Programme"("code");
CREATE INDEX "Batch_programmeId_idx" ON "Batch"("programmeId");
CREATE UNIQUE INDEX "Batch_programmeId_label_key" ON "Batch"("programmeId", "label");
CREATE UNIQUE INDEX "AlumniProfile_userId_key" ON "AlumniProfile"("userId");
CREATE INDEX "AlumniProfile_programmeId_idx" ON "AlumniProfile"("programmeId");
CREATE INDEX "AlumniProfile_batchId_idx" ON "AlumniProfile"("batchId");
CREATE INDEX "AlumniProfile_country_idx" ON "AlumniProfile"("country");
CREATE INDEX "AlumniProfile_specialization_idx" ON "AlumniProfile"("specialization");
CREATE INDEX "AlumniProfile_verificationStatus_idx" ON "AlumniProfile"("verificationStatus");
CREATE INDEX "AlumniVerification_alumniProfileId_submittedAt_idx" ON "AlumniVerification"("alumniProfileId", "submittedAt");
CREATE INDEX "AlumniVerification_status_submittedAt_idx" ON "AlumniVerification"("status", "submittedAt");
CREATE INDEX "VerificationAuditEvent_alumniVerificationId_createdAt_idx" ON "VerificationAuditEvent"("alumniVerificationId", "createdAt");

-- A profile can only have one active request, including concurrent submissions.
CREATE UNIQUE INDEX "AlumniVerification_one_active_per_profile"
  ON "AlumniVerification"("alumniProfileId")
  WHERE "status" IN ('PENDING', 'UNDER_REVIEW');

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AlumniProfile" ADD CONSTRAINT "AlumniProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AlumniProfile" ADD CONSTRAINT "AlumniProfile_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AlumniProfile" ADD CONSTRAINT "AlumniProfile_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AlumniVerification" ADD CONSTRAINT "AlumniVerification_alumniProfileId_fkey" FOREIGN KEY ("alumniProfileId") REFERENCES "AlumniProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AlumniVerification" ADD CONSTRAINT "AlumniVerification_claimedProgrammeId_fkey" FOREIGN KEY ("claimedProgrammeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AlumniVerification" ADD CONSTRAINT "AlumniVerification_claimedBatchId_fkey" FOREIGN KEY ("claimedBatchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AlumniVerification" ADD CONSTRAINT "AlumniVerification_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VerificationAuditEvent" ADD CONSTRAINT "VerificationAuditEvent_alumniVerificationId_fkey" FOREIGN KEY ("alumniVerificationId") REFERENCES "AlumniVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VerificationAuditEvent" ADD CONSTRAINT "VerificationAuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
