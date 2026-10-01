import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  collectCspConsoleMessages,
  installCspMonitor,
  readCspReports,
  reportCspViolations,
  type CspReport,
} from "./csp-monitor";

type CapturedEmail = {
  to?: string[];
  subject?: string;
  text?: string;
};

async function waitForOtp(email: string, type: string) {
  const expectedSubject =
    type === "email-verification"
      ? "Verify your BPKIHS Alumni email"
      : "Reset your BPKIHS Alumni password";
  const emailFile = path.resolve("test-results/e2e-emails.jsonl");

  await expect
    .poll(
      async () => {
        try {
          const messages = (await readFile(emailFile, "utf8"))
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((line) => JSON.parse(line) as CapturedEmail);
          const message = messages.find(
            (candidate) =>
              candidate.to?.includes(email) &&
              candidate.subject === expectedSubject,
          );
          return message?.text?.match(/\bis (\d{6})\./)?.[1] ?? "";
        } catch {
          return "";
        }
      },
      { timeout: 10_000 },
    )
    .toMatch(/^[0-9]{6}$/);

  const messages = (await readFile(emailFile, "utf8"))
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as CapturedEmail);
  const message = messages.find(
    (candidate) =>
      candidate.to?.includes(email) && candidate.subject === expectedSubject,
  );

  return message?.text?.match(/\bis (\d{6})\./)?.[1] ?? "";
}

test("registration, session, sign-out, and password reset work end to end", async ({
  page,
}) => {
  const cspReports: CspReport[] = [];
  await installCspMonitor(page);
  collectCspConsoleMessages(page, cspReports);

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const email = `e2e-${suffix}@example.com`;
  const password = "Valid-password-123";
  const newPassword = "New-valid-password-456";

  await page.goto("/sign-up");
  await page.getByLabel("Full name").fill("E2E Alumni");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/verify-email/);

  const verificationOtp = await waitForOtp(email, "email-verification");
  await page.getByLabel("Verification code").fill("000000");
  await page.getByRole("button", { name: "Verify email" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByLabel("Verification code").fill(verificationOtp);
  await page.getByRole("button", { name: "Verify email" }).click();
  await expect(page).toHaveURL(/\/sign-in/);

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");

  const sessionCookies = await page.context().cookies();
  expect(
    sessionCookies.some(
      (cookie) => cookie.name.includes("session") && cookie.secure,
    ),
  ).toBe(true);

  const profileResponse = await page.request.get("/api/alumni/me");
  expect(profileResponse.status()).toBe(200);

  const signOutResponse = await page.evaluate(async () => {
    const response = await fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: "{}",
    });

    return { ok: response.ok, status: response.status };
  });
  expect(signOutResponse).toEqual({ ok: true, status: 200 });

  await page.goto("/forgot-password");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Email reset code" }).click();
  await expect(page).toHaveURL(/\/reset-password/);

  const resetOtp = await waitForOtp(email, "forget-password");
  await page.getByLabel("Reset code").fill(resetOtp);
  await page.getByLabel("New password").fill(newPassword);
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page).toHaveURL(/\/sign-in/);

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toBeVisible();

  await page.getByLabel("Password").fill(newPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");

  const allReports = [...cspReports, ...(await readCspReports(page))];
  reportCspViolations(allReports);
  expect(allReports).toEqual([]);
});