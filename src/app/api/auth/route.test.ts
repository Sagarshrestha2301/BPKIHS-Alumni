import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendAuthenticationOtp: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendAuthenticationOtp: mocks.sendAuthenticationOtp,
}));

import { POST } from "@/app/api/auth/[...all]/route";
import { prisma } from "@/lib/db";

describe("POST /api/auth/sign-up/email", () => {
  const createdEmails: string[] = [];
  const testIps: string[] = [];

  afterEach(async () => {
    if (createdEmails.length > 0) {
      await prisma.verification.deleteMany({
        where: {
          OR: createdEmails.map((email) => ({
            identifier: { contains: email },
          })),
        },
      });

      await prisma.user.deleteMany({
        where: { email: { in: createdEmails } },
      });
    }

    if (testIps.length > 0) {
      await prisma.rateLimit.deleteMany({
        where: {
          OR: testIps.map((testIp) => ({ key: { contains: testIp } })),
        },
      });
    }

    createdEmails.length = 0;
    testIps.length = 0;
    mocks.sendAuthenticationOtp.mockReset();
  });

  it("uses the database-backed sign-up limit before sending another OTP", async () => {
    const suffix = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
    testIps.push(testIp);

    async function signUp(index: number) {
      const email = `rate-limit-${suffix}-${index}@example.com`;
      createdEmails.push(email);

      return POST(
        new Request("http://localhost:3000/api/auth/sign-up/email", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
            "x-forwarded-for": testIp,
          },
          body: JSON.stringify({
            name: "Rate Limit Test",
            email,
            password: "Valid-password-123",
          }),
        }),
      );
    }

    await expect(signUp(1)).resolves.toMatchObject({ status: 200 });
    await expect(signUp(2)).resolves.toMatchObject({ status: 200 });
    await expect(signUp(3)).resolves.toMatchObject({ status: 200 });

    const limited = await signUp(4);

    expect(limited.status).toBe(429);
    expect(limited.headers.get("x-retry-after")).toBeTruthy();
    await expect(limited.json()).resolves.toEqual({
      message: "Too many requests. Please try again later.",
    });
    expect(mocks.sendAuthenticationOtp).toHaveBeenCalledTimes(3);
  });
});
