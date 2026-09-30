import "server-only";

import {
  AlumniVerificationStatus,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export class VerificationInputError extends Error {}

const activeVerificationStatuses: AlumniVerificationStatus[] = [
  AlumniVerificationStatus.PENDING,
  AlumniVerificationStatus.UNDER_REVIEW,
];

export async function getOwnVerification(userId: string) {
  const profile = await prisma.alumniProfile.findUnique({
    where: { userId },
    select: {
      verifications: {
        orderBy: { submittedAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
        },
      },
    },
  });

  return profile?.verifications[0] ?? null;
}

export async function submitOwnVerification(userId: string) {
  const profile = await prisma.alumniProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      programmeId: true,
      batchId: true,
      admissionYear: true,
      graduationYear: true,
      batch: {
        select: { programmeId: true },
      },
    },
  });

  if (!profile?.programmeId || !profile.batchId || !profile.batch) {
    throw new VerificationInputError(
      "Complete your programme and batch before submitting verification.",
    );
  }

  if (profile.batch.programmeId !== profile.programmeId) {
    throw new VerificationInputError(
      "Select a batch that belongs to your programme before submitting verification.",
    );
  }

  const claimedProgrammeId: string = profile.programmeId;
  const claimedBatchId: string = profile.batchId;

  const activeVerification = await prisma.alumniVerification.findFirst({
    where: {
      alumniProfileId: profile.id,
      status: { in: activeVerificationStatuses },
    },
    select: { id: true },
  });

  if (activeVerification) {
    throw new VerificationInputError(
      "You already have a verification request in progress.",
    );
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      const verification = await transaction.alumniVerification.create({
        data: {
          alumniProfileId: profile.id,
          claimedProgrammeId,
          claimedBatchId,
          claimedAdmissionYear: profile.admissionYear,
          claimedGraduationYear: profile.graduationYear,
          status: AlumniVerificationStatus.PENDING,
        },
        select: {
          id: true,
          status: true,
          submittedAt: true,
        },
      });

      await transaction.verificationAuditEvent.create({
        data: {
          alumniVerificationId: verification.id,
          actorUserId: userId,
          newStatus: AlumniVerificationStatus.PENDING,
        },
      });

      await transaction.alumniProfile.update({
        where: { id: profile.id },
        data: { verificationStatus: AlumniVerificationStatus.PENDING },
      });

      return verification;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new VerificationInputError(
        "You already have a verification request in progress.",
      );
    }

    throw error;
  }
}
