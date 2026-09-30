import { describe, expect, it, vi } from "vitest";

import { GET, PATCH } from "@/app/api/alumni/me/route";
import { AlumniProfileInputError } from "@/features/alumni/profile.service";

const mocks = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  getOwnAlumniProfile: vi.fn(),
  updateOwnAlumniProfile: vi.fn(),
}));

vi.mock("@/lib/auth-session", () => ({
  getCurrentSession: mocks.getCurrentSession,
}));

vi.mock("@/features/alumni/profile.service", () => ({
  getOwnAlumniProfile: mocks.getOwnAlumniProfile,
  updateOwnAlumniProfile: mocks.updateOwnAlumniProfile,
  AlumniProfileInputError: class AlumniProfileInputError extends Error {},
}));

describe("GET /api/alumni/me", () => {
  it("returns 401 when the user is not authenticated", async () => {
    mocks.getCurrentSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "UNAUTHENTICATED",
        message: "Sign in to continue.",
      },
    });

    expect(mocks.getOwnAlumniProfile).not.toHaveBeenCalled();
  });

  it("returns the authenticated user's profile", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: {
        id: "user-valid",
      },
    });

    const profile = {
      id: "profile-1",
      firstName: "Asha",
      lastName: "Shrestha",
      programmeId: "cmj5x7q8p0000exampleprog1",
      batchId: "cmj5x7q8p0001examplebatch",
      admissionYear: 2018,
      graduationYear: 2023,
      specialization: "General Medicine",
      currentPosition: "Medical Officer",
      organization: "BPKIHS",
      city: "Dharan",
      country: "Nepal",
      furtherStudy: null,
      furtherStudyInstitution: null,
      biography: "BPKIHS alumna.",
      profileVisibility: "PRIVATE",
      verificationStatus: "NOT_STARTED",
      updatedAt: new Date("2026-09-30T12:00:00.000Z"),
    };

    mocks.getOwnAlumniProfile.mockResolvedValue(profile);

    const response = await GET();

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toEqual({
      data: {
        ...profile,
        updatedAt: "2026-09-30T12:00:00.000Z",
      },
    });
    expect(response.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0, must-revalidate",
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");

    expect(mocks.getOwnAlumniProfile).toHaveBeenCalledWith("user-valid");
  });

  it("returns null when the authenticated user has no profile", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: {
        id: "user-without-profile",
      },
    });

    mocks.getOwnAlumniProfile.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toEqual({
      data: null,
    });

    expect(mocks.getOwnAlumniProfile).toHaveBeenCalledWith(
      "user-without-profile",
    );
  });

  it("does not expose internal errors", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: { id: "user-valid" },
    });
    mocks.getOwnAlumniProfile.mockRejectedValue(
      new Error("Database connection failed: credential details"),
    );

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "We could not process your request. Please try again later.",
      },
    });
    expect(response.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0, must-revalidate",
    );
  });
});

describe("PATCH /api/alumni/me", () => {
  it("returns 401 when the user is not authenticated", async () => {
    mocks.getCurrentSession.mockResolvedValue(null);

    const request = new Request("http://localhost/api/alumni/me", {
      method: "PATCH",
      body: JSON.stringify({
        firstName: "Asha",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await PATCH(request);

    expect(response.status).toBe(401);

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "UNAUTHENTICATED",
        message: "Sign in to continue.",
      },
    });

    expect(mocks.updateOwnAlumniProfile).not.toHaveBeenCalled();
  });

  it("returns 400 when the request body is not valid JSON", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: {
        id: "user-valid",
      },
    });

    const request = new Request("http://localhost/api/alumni/me", {
      method: "PATCH",
      body: "{invalid-json",
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await PATCH(request);

    expect(response.status).toBe(400);

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Submit valid JSON.",
      },
    });

    expect(mocks.updateOwnAlumniProfile).not.toHaveBeenCalled();
  });

  it("returns 415 for a non-JSON profile payload", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: {
        id: "user-valid",
      },
    });

    const request = new Request("http://localhost/api/alumni/me", {
      method: "PATCH",
      body: "firstName=Asha",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    const response = await PATCH(request);

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "Submit the profile as JSON.",
      },
    });
    expect(mocks.updateOwnAlumniProfile).not.toHaveBeenCalled();
  });

  it("returns 400 when the profile payload fails validation", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: {
        id: "user-valid",
      },
    });

    const request = new Request("http://localhost/api/alumni/me", {
      method: "PATCH",
      body: JSON.stringify({
        firstName: "Asha",
        unknownField: "should-not-be-accepted",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await PATCH(request);

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe(
      "The submitted profile is invalid.",
    );
    expect(body.error.fields).toBeDefined();

    expect(mocks.updateOwnAlumniProfile).not.toHaveBeenCalled();
  });

  it("returns 400 when no profile fields are submitted", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: {
        id: "user-valid",
      },
    });

    const request = new Request("http://localhost/api/alumni/me", {
      method: "PATCH",
      body: JSON.stringify({}),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await PATCH(request);

    expect(response.status).toBe(400);

    const body = await response.json();

    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe(
      "The submitted profile is invalid.",
    );

    expect(mocks.updateOwnAlumniProfile).not.toHaveBeenCalled();
  });

  it("returns 400 when the profile service rejects the update", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: {
        id: "user-valid",
      },
    });

    const programmeId = "cmj5x7q8p0000exampleprog1";
    const batchId = "cmj5x7q8p0001examplebatch";

    mocks.updateOwnAlumniProfile.mockRejectedValue(
      new AlumniProfileInputError(
        "The selected batch does not belong to the selected programme.",
      ),
    );

    const request = new Request("http://localhost/api/alumni/me", {
      method: "PATCH",
      body: JSON.stringify({
        programmeId,
        batchId,
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await PATCH(request);

    expect(response.status).toBe(400);

    await expect(response.json()).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message:
          "The selected batch does not belong to the selected programme.",
      },
    });

    expect(mocks.updateOwnAlumniProfile).toHaveBeenCalledWith(
      "user-valid",
      {
        programmeId,
        batchId,
      },
    );
  });

  it("updates the authenticated user's profile", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: {
        id: "user-valid",
      },
    });

    const updatedProfile = {
      id: "profile-1",
      firstName: "Asha",
      lastName: null,
      programmeId: "cmj5x7q8p0000exampleprog1",
      batchId: "cmj5x7q8p0001examplebatch",
      admissionYear: null,
      graduationYear: null,
      specialization: null,
      currentPosition: "Medical Officer",
      organization: null,
      city: "Dharan",
      country: "Nepal",
      furtherStudy: null,
      furtherStudyInstitution: null,
      biography: null,
      profileVisibility: "PRIVATE",
      verificationStatus: "NOT_STARTED",
      updatedAt: new Date("2026-09-30T12:00:00.000Z"),
    };

    mocks.updateOwnAlumniProfile.mockResolvedValue(updatedProfile);

    const request = new Request("http://localhost/api/alumni/me", {
      method: "PATCH",
      body: JSON.stringify({
        firstName: "Asha",
        currentPosition: "Medical Officer",
        city: "Dharan",
        country: "Nepal",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toEqual({
      data: {
        ...updatedProfile,
        updatedAt: "2026-09-30T12:00:00.000Z",
      },
    });
    expect(response.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0, must-revalidate",
    );

    expect(mocks.updateOwnAlumniProfile).toHaveBeenCalledWith(
      "user-valid",
      {
        firstName: "Asha",
        currentPosition: "Medical Officer",
        city: "Dharan",
        country: "Nepal",
      },
    );
  });

  it("does not allow protected fields to reach the profile service", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: {
        id: "user-valid",
      },
    });

    const request = new Request("http://localhost/api/alumni/me", {
      method: "PATCH",
      body: JSON.stringify({
        firstName: "Asha",
        verificationStatus: "VERIFIED",
        profileVisibility: "PUBLIC",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await PATCH(request);

    expect(response.status).toBe(400);

    expect(mocks.updateOwnAlumniProfile).not.toHaveBeenCalled();
  });

  it("does not expose internal update errors", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: {
        id: "user-valid",
      },
    });
    mocks.updateOwnAlumniProfile.mockRejectedValue(
      new Error("Database connection failed: credential details"),
    );

    const request = new Request("http://localhost/api/alumni/me", {
      method: "PATCH",
      body: JSON.stringify({ firstName: "Asha" }),
      headers: {
        "content-type": "application/json",
      },
    });

    const response = await PATCH(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "We could not process your request. Please try again later.",
      },
    });
  });
});
