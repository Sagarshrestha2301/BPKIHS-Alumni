import { describe, expect, it } from "vitest";

import { isE2eOtpCaptureEnabled } from "@/lib/email";

describe("isE2eOtpCaptureEnabled", () => {
  it("requires the E2E flag", () => {
    expect(isE2eOtpCaptureEnabled({ NODE_ENV: "test" })).toBe(false);
  });

  it("is enabled only outside production", () => {
    expect(
      isE2eOtpCaptureEnabled({ E2E: "1", NODE_ENV: "development" }),
    ).toBe(true);
    expect(isE2eOtpCaptureEnabled({ E2E: "1", NODE_ENV: "production" })).toBe(
      false,
    );
  });
});