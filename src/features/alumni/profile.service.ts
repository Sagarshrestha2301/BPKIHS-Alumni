import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { AlumniProfileUpdate } from "@/features/alumni/profile.schema";
import { prisma } from "@/lib/db";

export class AlumniProfileInputError extends Error {}

const ownProfileSelect = {
  id: true,
  firstName: true,
  lastName: true,
  programmeId: true,
  batchId: true,
  admissionYear: true,
  graduationYear: true,
  specialization: true,
  currentPosition: true,
  organization: true,
  city: true,
  country: true,
  furtherStudy: true,
  furtherStudyInstitution: true,
  biography: true,
  profileVisibility: true,
  verificationStatus: true,
  updatedAt: true,
} satisfies Prisma.AlumniProfileSelect;

export async function getOwnAlumniProfile(userId: string) {
  return prisma.alumniProfile.findUnique({
    where: { userId },
    select: ownProfileSelect,
  });
}

function submittedOrCurrent<T>(
  submitted: T | undefined,
  current: T | null | undefined,
) {
  return submitted === undefined ? (current ?? null) : submitted;
}

async function validateProgrammeAndBatch(
  profile: AlumniProfileUpdate,
  currentProfile: Awaited<ReturnType<typeof getOwnAlumniProfile>>,
) {
  const programmeId = submittedOrCurrent(
    profile.programmeId,
    currentProfile?.programmeId,
  );
  const batchId = submittedOrCurrent(profile.batchId, currentProfile?.batchId);
  const admissionYear = submittedOrCurrent(
    profile.admissionYear,
    currentProfile?.admissionYear,
  );
  const graduationYear = submittedOrCurrent(
    profile.graduationYear,
    currentProfile?.graduationYear,
  );

  if (
    admissionYear !== null &&
    graduationYear !== null &&
    admissionYear > graduationYear
  ) {
    throw new AlumniProfileInputError(
      "Admission year cannot be later than graduation year.",
    );
  }

  if (programmeId && profile.programmeId !== undefined) {
    const programme = await prisma.programme.findUnique({
      where: { id: programmeId },
      select: { id: true },
    });

    if (!programme) {
      throw new AlumniProfileInputError(
        "The selected programme does not exist.",
      );
    }
  }

  if (!batchId) {
    return;
  }

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { programmeId: true },
  });

  if (!batch) {
    throw new AlumniProfileInputError("The selected batch does not exist.");
  }

  if (programmeId !== batch.programmeId) {
    throw new AlumniProfileInputError(
      "The selected batch does not belong to the selected programme.",
    );
  }
}

export async function updateOwnAlumniProfile(
  userId: string,
  profile: AlumniProfileUpdate,
) {
  const currentProfile = await getOwnAlumniProfile(userId);
  await validateProgrammeAndBatch(profile, currentProfile);

  return prisma.alumniProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...profile,
    },
    update: profile,
    select: ownProfileSelect,
  });
}
