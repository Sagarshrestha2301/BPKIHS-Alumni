import { describe, expect, it } from "vitest";

import { updateAlumniProfileSchema } from "@/features/alumni/profile.schema";

describe("updateAlumniProfileSchema", () => {
  it("accepts a small, valid profile update", () => {
    const result = updateAlumniProfileSchema.safeParse({
      firstName: "Asha",
      country: "Nepal",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a graduation year before the admission year", () => {
    const result = updateAlumniProfileSchema.safeParse({
      admissionYear: 2024,
      graduationYear: 2023,
    });

    expect(result.success).toBe(false);
  });
});
