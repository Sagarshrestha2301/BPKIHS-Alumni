import { z } from "zod";

const optionalText = (maximumLength: number) =>
  z.string().trim().max(maximumLength).nullable().optional();

const optionalYear = z.int().min(1800).max(3000).nullable().optional();

export const updateAlumniProfileSchema = z
  .object({
    firstName: optionalText(100),
    lastName: optionalText(100),
    programmeId: z.cuid().nullable().optional(),
    batchId: z.cuid().nullable().optional(),
    admissionYear: optionalYear,
    graduationYear: optionalYear,
    specialization: optionalText(160),
    currentPosition: optionalText(160),
    organization: optionalText(160),
    city: optionalText(120),
    country: optionalText(120),
    furtherStudy: optionalText(160),
    furtherStudyInstitution: optionalText(160),
    biography: optionalText(2_000),
  })
  .strict()
  .refine((profile) => Object.keys(profile).length > 0, {
    message: "Provide at least one profile field.",
  })
  .refine(
    (profile) =>
      profile.admissionYear === undefined ||
      profile.graduationYear === undefined ||
      profile.admissionYear === null ||
      profile.graduationYear === null ||
      profile.admissionYear <= profile.graduationYear,
    {
      message: "Admission year cannot be later than graduation year.",
      path: ["graduationYear"],
    },
  );

export type AlumniProfileUpdate = z.infer<typeof updateAlumniProfileSchema>;
