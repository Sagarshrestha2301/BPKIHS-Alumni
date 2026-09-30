import { describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/verification/route";
import { GET } from "@/app/api/verification/me/route";
import { VerificationInputError } from "@/features/alumni/verification.service";

const mocks = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  getOwnVerification: vi.fn(),
  submitOwnVerification: vi.fn(),
}));

vi.mock("@/lib/auth-session", () => ({
  getCurrentSession: mocks.getCurrentSession,
}));

vi.mock("@/features/alumni/verification.service", () => ({
  getOwnVerification: mocks.getOwnVerification,
  submitOwnVerification: mocks.submitOwnVerification,
  VerificationInputError: class VerificationInputError extends Error {},
}));

describe("POST /api/verification", () => {
  it("returns 401 when the user is not authenticated", async () => {
    mocks.getCurrentSession.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "UNAUTHENTICATED",
        message: "Sign in to continue.",
      },
    });
    expect(mocks.submitOwnVerification).not.toHaveBeenCalled();
  });

  it("returns 403 when the user's email is not verified", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: { id: "user-valid", emailVerified: false },
    });

    const response = await POST();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "EMAIL_NOT_VERIFIED",
        message: "Verify your email before submitting an alumni claim.",
      },
    });
    expect(mocks.submitOwnVerification).not.toHaveBeenCalled();
  });

  it("returns the submitted verification", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: { id: "user-valid", emailVerified: true },
    });
    const verification = { id: "verification-1", status: "PENDING" };
    mocks.submitOwnVerification.mockResolvedValue(verification);

    const response = await POST();

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ data: verification });
    expect(response.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0, must-revalidate",
    );
    expect(mocks.submitOwnVerification).toHaveBeenCalledWith("user-valid");
  });

  it("returns 409 when the verification cannot be submitted", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: { id: "user-valid", emailVerified: true },
    });
    mocks.submitOwnVerification.mockRejectedValue(
      new VerificationInputError("An alumni profile is required."),
    );

    const response = await POST();

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "VERIFICATION_NOT_READY",
        message: "An alumni profile is required.",
      },
    });
  });

  it("does not expose internal submission errors", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: { id: "user-valid", emailVerified: true },
    });
    mocks.submitOwnVerification.mockRejectedValue(
      new Error("Database connection failed: credential details"),
    );

    const response = await POST();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "We could not process your request. Please try again later.",
      },
    });
  });
});

describe("GET /api/verification/me", () => {
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
    expect(mocks.getOwnVerification).not.toHaveBeenCalled();
  });

  it("returns the authenticated user's verification", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: { id: "user-valid" },
    });
    const verification = { id: "verification-1", status: "PENDING" };
    mocks.getOwnVerification.mockResolvedValue(verification);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: verification });
    expect(response.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0, must-revalidate",
    );
    expect(mocks.getOwnVerification).toHaveBeenCalledWith("user-valid");
  });

  it("does not expose internal retrieval errors", async () => {
    mocks.getCurrentSession.mockResolvedValue({
      user: { id: "user-valid" },
    });
    mocks.getOwnVerification.mockRejectedValue(
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
  });
});
