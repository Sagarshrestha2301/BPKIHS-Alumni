import { afterEach, describe, expect, it } from "vitest";

import { ProfileVisibility } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  AlumniProfileInputError,
  getOwnAlumniProfile,
  updateOwnAlumniProfile,
} from "@/features/alumni/profile.service";

describe("profile.service", () => {
  const createdUserIds: string[] = [];
  const createdProfileIds: string[] = [];
  const createdProgrammeIds: string[] = [];
  const createdBatchIds: string[] = [];

  afterEach(async () => {
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

    createdProfileIds.length = 0;
    createdBatchIds.length = 0;
    createdProgrammeIds.length = 0;
    createdUserIds.length = 0;
  });

  it("returns null when the user does not have an alumni profile", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const user = await prisma.user.create({
      data: {
        id: `test-profile-user-${suffix}`,
        name: "Profile Test User",
        email: `profile-test-${suffix}@example.com`,
        emailVerified: true,
      },
    });

    createdUserIds.push(user.id);

    const profile = await getOwnAlumniProfile(user.id);

    expect(profile).toBeNull();
  });

  it("creates an alumni profile for the authenticated user", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const programme = await prisma.programme.create({
      data: {
        name: `Profile Test Programme ${suffix}`,
        code: `PROFILE-${suffix.slice(-12)}`,
      },
    });

    createdProgrammeIds.push(programme.id);

    const batch = await prisma.batch.create({
      data: {
        programmeId: programme.id,
        label: `Profile Test Batch ${suffix}`,
        admissionYear: 2018,
        graduationYear: 2023,
      },
    });

    createdBatchIds.push(batch.id);

    const user = await prisma.user.create({
      data: {
        id: `test-profile-user-${suffix}`,
        name: "Profile Create User",
        email: `profile-create-${suffix}@example.com`,
        emailVerified: true,
      },
    });

    createdUserIds.push(user.id);

    const profile = await updateOwnAlumniProfile(user.id, {
      firstName: "Asha",
      lastName: "Shrestha",
      programmeId: programme.id,
      batchId: batch.id,
      admissionYear: 2018,
      graduationYear: 2023,
      currentPosition: "Medical Officer",
      organization: "BPKIHS",
      city: "Dharan",
      country: "Nepal",
    });

    createdProfileIds.push(profile.id);

    expect(profile).toMatchObject({
      firstName: "Asha",
      lastName: "Shrestha",
      programmeId: programme.id,
      batchId: batch.id,
      admissionYear: 2018,
      graduationYear: 2023,
      currentPosition: "Medical Officer",
      organization: "BPKIHS",
      city: "Dharan",
      country: "Nepal",
      profileVisibility: ProfileVisibility.PRIVATE,
    });

    const savedProfile = await prisma.alumniProfile.findUnique({
      where: { id: profile.id },
    });

    expect(savedProfile).toMatchObject({
      userId: user.id,
      firstName: "Asha",
      lastName: "Shrestha",
      programmeId: programme.id,
      batchId: batch.id,
    });
  });

  it("updates an existing alumni profile", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const user = await prisma.user.create({
      data: {
        id: `test-profile-user-${suffix}`,
        name: "Profile Update User",
        email: `profile-update-${suffix}@example.com`,
        emailVerified: true,
      },
    });

    createdUserIds.push(user.id);

    const profile = await prisma.alumniProfile.create({
      data: {
        userId: user.id,
        firstName: "Original",
        lastName: "Name",
        city: "Dharan",
        profileVisibility: ProfileVisibility.PRIVATE,
      },
    });

    createdProfileIds.push(profile.id);

    const updatedProfile = await updateOwnAlumniProfile(user.id, {
      firstName: "Updated",
      city: "Kathmandu",
      organization: "BPKIHS",
    });

    expect(updatedProfile).toMatchObject({
      id: profile.id,
      firstName: "Updated",
      city: "Kathmandu",
      organization: "BPKIHS",
    });

    const savedProfile = await prisma.alumniProfile.findUnique({
      where: { id: profile.id },
    });

    expect(savedProfile).toMatchObject({
      firstName: "Updated",
      lastName: "Name",
      city: "Kathmandu",
      organization: "BPKIHS",
    });
  });

  it("rejects a batch that does not exist", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const programme = await prisma.programme.create({
      data: {
        name: `Missing Batch Programme ${suffix}`,
        code: `MISSING-${suffix.slice(-12)}`,
      },
    });

    createdProgrammeIds.push(programme.id);

    const user = await prisma.user.create({
      data: {
        id: `test-profile-user-${suffix}`,
        name: "Missing Batch User",
        email: `profile-missing-batch-${suffix}@example.com`,
        emailVerified: true,
      },
    });

    createdUserIds.push(user.id);

    await expect(
      updateOwnAlumniProfile(user.id, {
        programmeId: programme.id,
        batchId: "cmj5x7q8p0001examplebatch",
      }),
    ).rejects.toThrowError(
      new AlumniProfileInputError("The selected batch does not exist."),
    );
  });

  it("rejects a programme that does not exist", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const user = await prisma.user.create({
      data: {
        id: `test-profile-user-${suffix}`,
        name: "Missing Programme User",
        email: `profile-missing-programme-${suffix}@example.com`,
        emailVerified: true,
      },
    });

    createdUserIds.push(user.id);

    await expect(
      updateOwnAlumniProfile(user.id, {
        programmeId: "cmj5x7q8p0000exampleprog1",
      }),
    ).rejects.toThrowError(
      new AlumniProfileInputError("The selected programme does not exist."),
    );
  });

  it("rejects a batch that belongs to another programme", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const programmeOne = await prisma.programme.create({
      data: {
        name: `Programme One ${suffix}`,
        code: `ONE-${suffix.slice(-12)}`,
      },
    });

    createdProgrammeIds.push(programmeOne.id);

    const programmeTwo = await prisma.programme.create({
      data: {
        name: `Programme Two ${suffix}`,
        code: `TWO-${suffix.slice(-12)}`,
      },
    });

    createdProgrammeIds.push(programmeTwo.id);

    const batch = await prisma.batch.create({
      data: {
        programmeId: programmeTwo.id,
        label: `Programme Two Batch ${suffix}`,
      },
    });

    createdBatchIds.push(batch.id);

    const user = await prisma.user.create({
      data: {
        id: `test-profile-user-${suffix}`,
        name: "Programme Mismatch User",
        email: `profile-mismatch-${suffix}@example.com`,
        emailVerified: true,
      },
    });

    createdUserIds.push(user.id);

    await expect(
      updateOwnAlumniProfile(user.id, {
        programmeId: programmeOne.id,
        batchId: batch.id,
      }),
    ).rejects.toThrowError(
      new AlumniProfileInputError(
        "The selected batch does not belong to the selected programme.",
      ),
    );
  });

  it("scopes profile updates to the authenticated user's profile", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const userOne = await prisma.user.create({
      data: {
        id: `test-profile-user-one-${suffix}`,
        name: "Profile User One",
        email: `profile-user-one-${suffix}@example.com`,
        emailVerified: true,
      },
    });

    createdUserIds.push(userOne.id);

    const userTwo = await prisma.user.create({
      data: {
        id: `test-profile-user-two-${suffix}`,
        name: "Profile User Two",
        email: `profile-user-two-${suffix}@example.com`,
        emailVerified: true,
      },
    });

    createdUserIds.push(userTwo.id);

    const profileOne = await prisma.alumniProfile.create({
      data: {
        userId: userOne.id,
        firstName: "User",
        lastName: "One",
        profileVisibility: ProfileVisibility.PRIVATE,
      },
    });

    createdProfileIds.push(profileOne.id);

    const profileTwo = await prisma.alumniProfile.create({
      data: {
        userId: userTwo.id,
        firstName: "User",
        lastName: "Two",
        profileVisibility: ProfileVisibility.PRIVATE,
      },
    });

    createdProfileIds.push(profileTwo.id);

    await updateOwnAlumniProfile(userOne.id, {
      firstName: "Updated One",
    });

    const savedProfileOne = await prisma.alumniProfile.findUnique({
      where: { id: profileOne.id },
    });

    const savedProfileTwo = await prisma.alumniProfile.findUnique({
      where: { id: profileTwo.id },
    });

    expect(savedProfileOne?.firstName).toBe("Updated One");
    expect(savedProfileTwo?.firstName).toBe("User");
  });

  it("rejects updates that would make the stored study years invalid", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const user = await prisma.user.create({
      data: {
        id: `test-profile-user-${suffix}`,
        name: "Study Years User",
        email: `profile-study-years-${suffix}@example.com`,
        emailVerified: true,
      },
    });

    createdUserIds.push(user.id);

    const profile = await prisma.alumniProfile.create({
      data: {
        userId: user.id,
        admissionYear: 2020,
        graduationYear: 2024,
        profileVisibility: ProfileVisibility.PRIVATE,
      },
    });

    createdProfileIds.push(profile.id);

    await expect(
      updateOwnAlumniProfile(user.id, { admissionYear: 2025 }),
    ).rejects.toThrowError(
      new AlumniProfileInputError(
        "Admission year cannot be later than graduation year.",
      ),
    );
  });

  it("does not allow a programme to be cleared while its batch remains", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const programme = await prisma.programme.create({
      data: {
        name: `Clear Programme ${suffix}`,
        code: `CLEAR-${suffix.slice(-12)}`,
      },
    });

    createdProgrammeIds.push(programme.id);

    const batch = await prisma.batch.create({
      data: {
        programmeId: programme.id,
        label: `Clear Batch ${suffix}`,
      },
    });

    createdBatchIds.push(batch.id);

    const user = await prisma.user.create({
      data: {
        id: `test-profile-user-${suffix}`,
        name: "Clear Programme User",
        email: `profile-clear-programme-${suffix}@example.com`,
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

    await expect(
      updateOwnAlumniProfile(user.id, { programmeId: null }),
    ).rejects.toThrowError(
      new AlumniProfileInputError(
        "The selected batch does not belong to the selected programme.",
      ),
    );
  });
});
