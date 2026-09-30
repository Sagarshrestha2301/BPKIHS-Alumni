import { afterEach, describe, expect, it } from "vitest";

import {
  AlumniVerificationStatus,
  ProfileVisibility,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  getOwnVerification,
  submitOwnVerification,
  VerificationInputError,
} from "@/features/alumni/verification.service";

describe("verification.service", () => {
  const createdUserIds: string[] = [];
  const createdProfileIds: string[] = [];
  const createdVerificationIds: string[] = [];
  const createdProgrammeIds: string[] = [];
  const createdBatchIds: string[] = [];

  afterEach(async () => {
    if (createdVerificationIds.length > 0) {
      await prisma.verificationAuditEvent.deleteMany({
        where: {
          alumniVerificationId: { in: createdVerificationIds },
        },
      });

      await prisma.alumniVerification.deleteMany({
        where: {
          id: { in: createdVerificationIds },
        },
      });
    }

    if (createdProfileIds.length > 0) {
      await prisma.alumniProfile.deleteMany({
        where: {
          id: { in: createdProfileIds },
        },
      });
    }

    if (createdBatchIds.length > 0) {
      await prisma.batch.deleteMany({
        where: {
          id: { in: createdBatchIds },
        },
      });
    }

    if (createdProgrammeIds.length > 0) {
      await prisma.programme.deleteMany({
        where: {
          id: { in: createdProgrammeIds },
        },
      });
    }

    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: {
          id: { in: createdUserIds },
        },
      });
    }

    createdVerificationIds.length = 0;
    createdProfileIds.length = 0;
    createdBatchIds.length = 0;
    createdProgrammeIds.length = 0;
    createdUserIds.length = 0;
  });

  it("submits a verification request for a complete alumni profile", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const programme = await prisma.programme.create({
      data: {
        name: `Test Programme ${suffix}`,
        code: `TEST-${suffix.slice(-12)}`,
      },
    });

    createdProgrammeIds.push(programme.id);

    const batch = await prisma.batch.create({
      data: {
        programmeId: programme.id,
        label: `Test Batch ${suffix}`,
        admissionYear: 2020,
        graduationYear: 2024,
      },
    });

    createdBatchIds.push(batch.id);

    const user = await prisma.user.create({
      data: {
        id: `test-user-${suffix}`,
        name: "Verification Test User",
        email: `verification-test-${suffix}@example.com`,
        emailVerified: true,
      },
    });

    createdUserIds.push(user.id);

    const profile = await prisma.alumniProfile.create({
      data: {
        userId: user.id,
        firstName: "Verification",
        lastName: "Tester",
        programmeId: programme.id,
        batchId: batch.id,
        admissionYear: 2020,
        graduationYear: 2024,
        profileVisibility: ProfileVisibility.PRIVATE,
      },
    });

    createdProfileIds.push(profile.id);

    const verification = await submitOwnVerification(user.id);

    createdVerificationIds.push(verification.id);

    expect(verification.status).toBe(AlumniVerificationStatus.PENDING);

    const savedVerification = await prisma.alumniVerification.findUnique({
      where: { id: verification.id },
    });

    expect(savedVerification).toMatchObject({
      alumniProfileId: profile.id,
      claimedProgrammeId: programme.id,
      claimedBatchId: batch.id,
      claimedAdmissionYear: 2020,
      claimedGraduationYear: 2024,
      status: AlumniVerificationStatus.PENDING,
    });

    const auditEvent = await prisma.verificationAuditEvent.findFirst({
      where: {
        alumniVerificationId: verification.id,
      },
    });

    expect(auditEvent).toMatchObject({
      actorUserId: user.id,
      newStatus: AlumniVerificationStatus.PENDING,
    });

    const updatedProfile = await prisma.alumniProfile.findUnique({
      where: { id: profile.id },
      select: { verificationStatus: true },
    });

    expect(updatedProfile?.verificationStatus).toBe(
      AlumniVerificationStatus.PENDING,
    );

    const ownVerification = await getOwnVerification(user.id);

    expect(ownVerification).toMatchObject({
      id: verification.id,
      status: AlumniVerificationStatus.PENDING,
    });
    expect(ownVerification).not.toHaveProperty("decisionReason");
  });

  it("rejects submission when programme or batch is incomplete", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const user = await prisma.user.create({
      data: {
        id: `test-user-${suffix}`,
        name: "Incomplete Verification User",
        email: `verification-incomplete-${suffix}@example.com`,
        emailVerified: true,
      },
    });

    createdUserIds.push(user.id);

    const profile = await prisma.alumniProfile.create({
      data: {
        userId: user.id,
        firstName: "Incomplete",
        lastName: "Tester",
        profileVisibility: ProfileVisibility.PRIVATE,
      },
    });

    createdProfileIds.push(profile.id);

    await expect(submitOwnVerification(user.id)).rejects.toThrowError(
      new VerificationInputError(
        "Complete your programme and batch before submitting verification.",
      ),
    );
  });

  it("rejects a second active verification request", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const programme = await prisma.programme.create({
      data: {
        name: `Duplicate Test Programme ${suffix}`,
        code: `DUP-${suffix.slice(-12)}`,
      },
    });

    createdProgrammeIds.push(programme.id);

    const batch = await prisma.batch.create({
      data: {
        programmeId: programme.id,
        label: `Duplicate Test Batch ${suffix}`,
      },
    });

    createdBatchIds.push(batch.id);

    const user = await prisma.user.create({
      data: {
        id: `test-user-${suffix}`,
        name: "Duplicate Verification User",
        email: `verification-duplicate-${suffix}@example.com`,
        emailVerified: true,
      },
    });

    createdUserIds.push(user.id);

    const profile = await prisma.alumniProfile.create({
      data: {
        userId: user.id,
        programmeId: programme.id,
        batchId: batch.id,
        profileVisibility: ProfileVisibility.PRIVATE,
      },
    });

    createdProfileIds.push(profile.id);

    const firstVerification = await submitOwnVerification(user.id);

    createdVerificationIds.push(firstVerification.id);

    await expect(submitOwnVerification(user.id)).rejects.toThrowError(
      new VerificationInputError(
        "You already have a verification request in progress.",
      ),
    );
  });

  it("rejects a claim when the stored batch belongs to another programme", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const programmeOne = await prisma.programme.create({
      data: {
        name: `Claim Programme One ${suffix}`,
        code: `CLAIM-ONE-${suffix.slice(-8)}`,
      },
    });
    createdProgrammeIds.push(programmeOne.id);

    const programmeTwo = await prisma.programme.create({
      data: {
        name: `Claim Programme Two ${suffix}`,
        code: `CLAIM-TWO-${suffix.slice(-8)}`,
      },
    });
    createdProgrammeIds.push(programmeTwo.id);

    const batch = await prisma.batch.create({
      data: {
        programmeId: programmeTwo.id,
        label: `Claim Batch ${suffix}`,
      },
    });
    createdBatchIds.push(batch.id);

    const user = await prisma.user.create({
      data: {
        id: `test-user-${suffix}`,
        name: "Mismatched Claim User",
        email: `verification-mismatch-${suffix}@example.com`,
        emailVerified: true,
      },
    });
    createdUserIds.push(user.id);

    const profile = await prisma.alumniProfile.create({
      data: {
        userId: user.id,
        programmeId: programmeOne.id,
        batchId: batch.id,
        profileVisibility: ProfileVisibility.PRIVATE,
      },
    });
    createdProfileIds.push(profile.id);

    await expect(submitOwnVerification(user.id)).rejects.toThrowError(
      new VerificationInputError(
        "Select a batch that belongs to your programme before submitting verification.",
      ),
    );
  });
});
